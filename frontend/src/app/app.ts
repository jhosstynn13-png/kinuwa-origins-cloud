import { Component, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './app.html' 
})
export class App implements OnInit {
  inventario = signal<any[]>([]);

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    fetch('https://kinuwa-origins-cloud.onrender.com/api/productos')
      .then(respuesta => respuesta.json())
      .then(datos => {
        this.inventario.set(datos);
      })
      .catch(error => {
        console.error('Error de conexión con el backend:', error);
      });
  }
}