import { Component, signal, OnInit, computed } from '@angular/core'; // Añadimos computed para el total
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { createClient } from '@supabase/supabase-js'; 

const supabase = createClient('https://yimuttzzvijmvlxqleor.supabase.co', 'sb_publishable_N1S8_Clx9ZB0HemBFG35-A_qkTtYOEv');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './app.html' 
})
export class App implements OnInit {
  // --- SEÑALES (Signals) ---
  inventario = signal<any[]>([]);
  carrito = signal<any[]>([]);
  usuarioLogueado = signal<any>(null);
  rolActual = signal<'visitante' | 'cliente' | 'admin'>('visitante');

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

  // --- LÓGICA DE NEGOCIO (E-COMMERCE) ---
  cargarProductos() {
    fetch('https://kinuwa-origins-cloud.onrender.com/api/productos')
      .then(respuesta => respuesta.json())
      .then(datos => this.inventario.set(datos))
      .catch(error => console.error('Error de conexión:', error));
  }

  agregarAlCarrito(producto: any) {
    if (this.rolActual() === 'visitante') {
      alert("⚠️ Los visitantes solo pueden ver el catálogo. ¡Regístrate para comprar!");
      return;
    }
    this.carrito.update(items => [...items, producto]);
  }

  quitarDelCarrito(index: number) {
    this.carrito.update(items => items.filter((_, i) => i !== index));
  }

  // --- LÓGICA DE ROLES Y SEGURIDAD (OPERACIÓN 04) ---
  
  entrarComoVisitante() {
    this.usuarioLogueado.set({ email: 'Invitado' });
    this.rolActual.set('visitante');
    alert("Has entrado como Visitante. Acceso de solo lectura.");
  }

  async registrarUsuario() {
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
      // Lógica de Rol: Si el correo es el tuyo, eres Admin, si no, Cliente.
      if (this.email === 'tu-correo-admin@gmail.com') {
        this.rolActual.set('admin');
      } else {
        this.rolActual.set('cliente');
      }
      alert(`Bienvenido. Rol: ${this.rolActual().toUpperCase()}`);
    }
  }

  async verificarSesion() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.usuarioLogueado.set(data.session.user);
      this.rolActual.set('cliente'); 
    }
  }

  async cerrarSesion() {
    await supabase.auth.signOut();
    this.usuarioLogueado.set(null);
    this.rolActual.set('visitante');
    this.carrito.set([]); // Limpiamos carrito al salir
  }
}