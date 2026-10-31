
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TimeoutError, finalize, timeout } from 'rxjs';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton
} from '@ionic/angular';

import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton
  ]
})
export class RegistroPage {
  nombre = '';
  correo = '';
  password = '';
  aceptaTratamiento = false;
  mensaje = '';
  cargando = false;

  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  registrar(): void {
    this.mensaje = '';

    if (
      !this.nombre.trim() ||
      !this.correo.trim() ||
      !this.password
    ) {
      this.mensaje = 'Completa todos los campos.';
      return;
    }

    if (!this.aceptaTratamiento) {
      this.mensaje =
        'Debes aceptar el tratamiento de datos personales para crear una cuenta.';
      return;
    }

    this.cargando = true;

    this.http.post<{ mensaje?: string }>(`${this.apiUrl}/registro`, {
      nombre: this.nombre.trim(),
      correo: this.correo.trim(),
      password: this.password,
      aceptaTratamiento: this.aceptaTratamiento
    }).pipe(
      timeout({ first: 15000 }),
      finalize(() => {
        this.cargando = false;
        this.changeDetector.markForCheck();
      })
    ).subscribe({
      next: (respuesta) => {
        this.mensaje =
          respuesta.mensaje || '¡Registro exitoso!';

        setTimeout(() => {
          this.router.navigateByUrl('/home');
        }, 1500);
      },
      error: (error: unknown) => {
        if (error instanceof TimeoutError) {
          this.mensaje =
            'El servidor tardó demasiado en responder. Verifica que el backend y la base de datos estén funcionando e intenta de nuevo.';
        } else if (error instanceof HttpErrorResponse) {
          this.mensaje =
            error.error?.mensaje ||
            (error.status === 0
              ? 'No hay conexión con el servidor. Inicia el backend con "npm run start:backend" y vuelve a intentarlo.'
              : 'No se pudo completar el registro. Verifica la conexión con el servidor.');
        } else {
          this.mensaje = 'Ocurrió un error inesperado al registrar la cuenta.';
        }
      }
    });
  }
}
