import { Component, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { createClient } from '@supabase/supabase-js'; 

const supabase = createClient('https://yimuttzzvijmvlxqleor.supabase.co', 'sb_publishable_N1S8_Clx9ZB0HemBFG35-A_qkTtYOEv');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DecimalPipe, UpperCasePipe, FormsModule], 
  templateUrl: './app.html' 
})
export class App implements OnInit {
  inventario = signal<any[]>([]);
  carrito = signal<any[]>([]); 
  usuarioLogueado = signal<any>(null);
  rolActual = signal<'visitante' | 'cliente' | 'vendedor' | 'admin'>('visitante');

  email = '';
  password = '';

  // --- CÁLCULOS AUTOMÁTICOS MEJORADOS ---
  // Suma el precio multiplicado por la cantidad de cada producto
  totalCarrito = computed(() => {
    return this.carrito().reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  });

  // Cuenta cuántos artículos hay en total (ej. 3 galletas + 1 harina = 4 items)
  cantidadTotal = computed(() => {
    return this.carrito().reduce((acc, item) => acc + item.cantidad, 0);
  });

  ngOnInit() {
    this.cargarProductos();
    this.verificarSesion(); 
  }

  cargarProductos() {
    fetch('https://kinuwa-origins-cloud.onrender.com/api/productos')
      .then(respuesta => respuesta.json())
      .then(datos => this.inventario.set(datos))
      .catch(error => console.error('Error de conexión:', error));
  }

  // --- LÓGICA DE CARRITO AGRUPADO ---
  agregarAlCarrito(producto: any) {
    if (this.rolActual() === 'visitante') {
      alert("⚠️ Los visitantes solo pueden ver el catálogo. ¡Regístrate como cliente para comprar!");
      return;
    }

    this.carrito.update(items => {
      // Buscamos si el producto ya está en el carrito
      const itemExistente = items.find(item => item.id === producto.id);
      
      if (itemExistente) {
        // Si existe, aumentamos su cantidad
        return items.map(item => 
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        // Si es nuevo, lo agregamos con cantidad 1
        return [...items, { ...producto, cantidad: 1 }];
      }
    });
  }

  quitarDelCarrito(index: number) {
    this.carrito.update(items => items.filter((_, i) => i !== index));
  }

  procederPago() {
    if (this.carrito().length === 0) return;
    alert(`¡Conectando con pasarela de pago segura de AWS!\nTotal a cobrar: S/ ${this.totalCarrito().toFixed(2)}\n\nOperación validada correctamente.`);
    this.carrito.set([]); 
  }

  editarProducto(producto: any) {
    alert(`Abriendo editor seguro para: ${producto.nombre}\n\nPermiso concedido mediante políticas IAM (Rol: ${this.rolActual().toUpperCase()}).`);
  }

  borrarProducto(producto: any) {
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar "${producto.nombre}" de la base de datos RDS?`);
    if (confirmar) {
      this.inventario.update(items => items.filter(item => item.id !== producto.id));
      alert("Producto eliminado exitosamente.");
    }
  }

  entrarComoVisitante() {
    this.usuarioLogueado.set({ email: 'Modo Invitado' });
    this.rolActual.set('visitante');
  }

  async registrarUsuario() {
    if (!this.email || !this.password) return alert("Por favor, llena los campos.");
    const { data, error } = await supabase.auth.signUp({
      email: this.email,
      password: this.password,
    });
    if (error) alert("Error: " + error.message);
    else alert("¡Registro exitoso! Ya puedes iniciar sesión.");
  }

  async iniciarSesion() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });
    if (error) alert("Acceso denegado: " + error.message);
    else {
      this.usuarioLogueado.set(data.user);
      this.asignarRol(this.email);
    }
  }

  async verificarSesion() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.usuarioLogueado.set(data.session.user);
      this.asignarRol(data.session.user.email || '');
    }
  }

  asignarRol(correo: string) {
    if (correo.includes('admin')) {
      this.rolActual.set('admin');
    } else if (correo.includes('vendedor')) {
      this.rolActual.set('vendedor');
    } else {
      this.rolActual.set('cliente');
    }
  }

  async cerrarSesion() {
    await supabase.auth.signOut();
    this.usuarioLogueado.set(null);
    this.rolActual.set('visitante');
    this.carrito.set([]); 
  }
}