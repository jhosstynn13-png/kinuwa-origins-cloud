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
    fetch('http://localhost:3000/api/productos')
      .then(respuesta => respuesta.json())
      .then(datos => {
        this.inventario.set(datos);
      })
      .catch(error => {
        console.error('Error de conexión con el backend:', error);
      });
  }
}