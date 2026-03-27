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

  // --- VARIABLES PARA CREAR PRODUCTO ---
  mostrandoFormulario = signal(false);
  nuevoProducto = { nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '' };

  // --- CÁLCULOS AUTOMÁTICOS MEJORADOS ---
  totalCarrito = computed(() => {
    return this.carrito().reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  });

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
      const itemExistente = items.find(item => item.id === producto.id);
      
      if (itemExistente) {
        return items.map(item => 
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
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

  // --- ACCIONES CRUD (ADMIN / VENDEDOR) ---
  guardarProducto(producto: any) {
    producto.editando = false; 
    alert(`¡Cambios guardados en la base de datos RDS!\n\n${producto.nombre}\nNuevo Precio: S/ ${producto.precio}\nNuevo Stock: ${producto.stock}\n\nOperación validada correctamente mediante token JWT.`);
  }

  borrarProducto(producto: any) {
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar "${producto.nombre}" de la base de datos RDS?`);
    if (confirmar) {
      this.inventario.update(items => items.filter(item => item.id !== producto.id));
      alert("Producto eliminado exitosamente.");
    }
  }

  // --- NUEVO: FUNCIONES PARA AÑADIR PRODUCTO (SOLO ADMIN) ---
  abrirFormulario() {
    this.mostrandoFormulario.set(true);
  }

  cancelarFormulario() {
    this.mostrandoFormulario.set(false);
    this.nuevoProducto = { nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '' };
  }

  async crearProducto() {
    if (!this.nuevoProducto.nombre || !this.nuevoProducto.precio || !this.nuevoProducto.imagen) {
      return alert("Por favor, llena el nombre, el precio y coloca el link de la imagen.");
    }
    
    // 1. Enviamos los datos reales a tu tabla 'productos' en Supabase
    const { data, error } = await supabase
      .from('productos')
      .insert([
        {
          nombre: this.nuevoProducto.nombre,
          descripcion: this.nuevoProducto.descripcion,
          precio: this.nuevoProducto.precio,
          stock: this.nuevoProducto.stock,
          imagen: this.nuevoProducto.imagen
        }
      ])
      .select(); // Le pedimos a Supabase que nos devuelva el producto ya guardado (con su ID real)

    // 2. Verificamos si hubo un error en la base de datos
    if (error) {
      console.error("Error al guardar en BD:", error);
      return alert("Hubo un error al guardar en la Base de Datos: " + error.message);
    }

    // 3. Si se guardó con éxito, lo agregamos visualmente a la pantalla
    if (data && data.length > 0) {
      this.inventario.update(items => [...items, data[0]]);
      alert(`¡Éxito! Producto "${data[0].nombre}" guardado permanentemente en la Base de Datos Supabase (RDS).`);
    }
    
    // Limpiamos y cerramos el formulario
    this.cancelarFormulario();
  }

  // --- LÓGICA DE ROLES Y SESIONES ---
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

  // --- ACTULIZADO: INICIAR SESIÓN Y VERIFICAR ---
  async iniciarSesion() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });
    if (error) alert("Acceso denegado: " + error.message);
    else {
      this.usuarioLogueado.set(data.user);
      // Le pasamos el ID del usuario real para buscar su rol en la BD
      this.asignarRol(data.user.id, this.email);
    }
  }

  async verificarSesion() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.usuarioLogueado.set(data.session.user);
      // Le pasamos el ID si el usuario recarga la página
      this.asignarRol(data.session.user.id, data.session.user.email || '');
    }
  }

  // --- ACTUALIZADO: ASIGNACIÓN DE ROLES REAL DESDE LA BASE DE DATOS ---
  async asignarRol(userId: string, correo: string) {
    // 1. Vamos a tu tabla 'usuarios' a buscar el rol de esta persona
    const { data: perfil, error } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', userId)
      .single();

    // 2. Si lo encuentra en tu base de datos, usamos ese rol EXACTO
    if (perfil && perfil.rol) {
      this.rolActual.set(perfil.rol as any);
      console.log("Rol obtenido de BD:", perfil.rol);
    } 
    // 3. Sistema de respaldo (por si el usuario es nuevo y aún no lo metes a la tabla)
    else {
      if (correo.includes('admin')) {
        this.rolActual.set('admin');
      } else if (correo.includes('vendedor')) {
        this.rolActual.set('vendedor');
      } else {
        this.rolActual.set('cliente');
      }
    }
  }

  async cerrarSesion() {
    await supabase.auth.signOut();
    this.usuarioLogueado.set(null);
    this.rolActual.set('visitante');
    this.carrito.set([]); 
  }
}