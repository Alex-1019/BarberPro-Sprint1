import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem } from '@ionic/angular';

interface LoginResponse {
  mensaje: string;
  usuario: {
    id: number;
    nombre: string;
    correo: string;
  };
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
  ],
})
export class HomePage {
  correo = '';
  password = '';
  mensaje = '';
  cargando = false;

  private apiUrl = 'http://localhost:3000/api';
  private readonly http = inject(HttpClient);
  private readonly changeDetector = inject(ChangeDetectorRef);

  iniciarSesion(): void {
    this.mensaje = '';

    if (!this.correo.trim() || !this.password) {
      this.mensaje = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;

    this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      correo: this.correo.trim(),
      password: this.password,
    }).subscribe({
      next: (respuesta) => {
        this.mensaje = `¡Bienvenido, ${respuesta.usuario.nombre}!`;
        this.cargando = false;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.mensaje =
          error.error?.mensaje ||
          'No se pudo iniciar sesión. Verifica tus datos o la conexión.';
        this.cargando = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
