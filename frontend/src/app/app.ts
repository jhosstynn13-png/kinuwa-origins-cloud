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
  // --- SEÑALES (Estado de la App) ---
  inventario = signal<any[]>([]);
  carrito = signal<any[]>([]);
  usuarioLogueado = signal<any>(null);
  
  // Definimos los 4 roles exactos para la Operación 04
  rolActual = signal<'visitante' | 'cliente' | 'vendedor' | 'admin'>('visitante');

  // --- VARIABLES DE FORMULARIO ---
  email = '';
  password = '';

  // --- CÁLCULOS AUTOMÁTICOS ---
  totalCarrito = computed(() => {
    return this.carrito().reduce((acc, item) => acc + item.precio, 0);
  });

  ngOnInit() {
    this.cargarProductos();
    this.verificarSesion(); 
  }

  // --- LÓGICA DE NEGOCIO ---
  cargarProductos() {
    fetch('https://kinuwa-origins-cloud.onrender.com/api/productos')
      .then(respuesta => respuesta.json())
      .then(datos => this.inventario.set(datos))
      .catch(error => console.error('Error de conexión:', error));
  }

  agregarAlCarrito(producto: any) {
    if (this.rolActual() === 'visitante') {
      alert("⚠️ Los visitantes solo pueden ver el catálogo. ¡Regístrate como cliente para comprar!");
      return;
    }
    this.carrito.update(items => [...items, producto]);
  }

  quitarDelCarrito(index: number) {
    this.carrito.update(items => items.filter((_, i) => i !== index));
  }

  // --- ACCIONES DE COMPRA (CLIENTE) ---
  procederPago() {
    if (this.carrito().length === 0) return;
    alert(`¡Conectando con pasarela de pago segura de AWS!\nTotal a cobrar: S/ ${this.totalCarrito().toFixed(2)}\n\nOperación validada correctamente.`);
    this.carrito.set([]); // Vaciamos el carrito después de la "compra"
  }

  // --- ACCIONES CRUD (ADMIN / VENDEDOR) ---
  editarProducto(producto: any) {
    alert(`Abriendo editor seguro para: ${producto.nombre}\n\nPermiso concedido mediante políticas IAM (Rol: ${this.rolActual().toUpperCase()}).`);
  }

  borrarProducto(producto: any) {
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar "${producto.nombre}" de la base de datos RDS?`);
    if (confirmar) {
      // Lo eliminamos visualmente del signal de Angular
      this.inventario.update(items => items.filter(item => item.id !== producto.id));
      alert("Producto eliminado exitosamente.");
    }
  }

  // --- LÓGICA DE ROLES Y SEGURIDAD (OPERACIÓN 04) ---
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

  // Función para simular roles en base al correo
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
    this.carrito.set([]); // Vaciamos el carrito al salir
  }
}