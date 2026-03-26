import { Component, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common'; // Quitamos NgIf de aquí
import { FormsModule } from '@angular/forms'; 
import { createClient } from '@supabase/supabase-js'; 

// Usamos tus credenciales de Supabase
const supabase = createClient('https://yimuttzzvijmvlxqleor.supabase.co', 'sb_secret_7dRg5makNCUYV8DEV-t8hA_SAemjB6v');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DecimalPipe, FormsModule], // Quitamos NgIf de aquí también
  templateUrl: './app.html' 
})
export class App implements OnInit {
  inventario = signal<any[]>([]);
  
  // Variables de Seguridad (Operación 04) [cite: 67, 68]
  email = '';
  password = '';
  usuarioLogueado = signal<any>(null);

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

  // --- LÓGICA DE SEGURIDAD (OPERACIÓN 04) [cite: 67, 68] ---
  
  async registrarUsuario() {
    const { data, error } = await supabase.auth.signUp({
      email: this.email,
      password: this.password,
    });
    if (error) alert("Error de registro: " + error.message);
    else alert("¡Usuario registrado exitosamente!");
  }

  async iniciarSesion() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });
    if (error) alert("Acceso denegado: " + error.message);
    else {
      this.usuarioLogueado.set(data.user);
      alert("Bienvenido a Kinuwa Origins");
    }
  }

  async verificarSesion() {
    const { data } = await supabase.auth.getSession();
    if (data.session) this.usuarioLogueado.set(data.session.user);
  }

  async cerrarSesion() {
    await supabase.auth.signOut();
    this.usuarioLogueado.set(null);
  }
}