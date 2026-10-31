import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { RegistroPage } from './registro.page';

describe('RegistroPage', () => {
  let component: RegistroPage;
  let fixture: ComponentFixture<RegistroPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays the privacy notice and consent checkbox', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.aviso-privacidad')?.textContent)
      .toContain('Aviso de privacidad y consentimiento');
    expect(element.querySelector('input[name="aceptaTratamiento"]'))
      .toBeTruthy();
  });

  it('sends registration data and displays server validation errors', () => {
    const http = TestBed.inject(HttpTestingController);
    component.nombre = 'Cliente';
    component.correo = 'cliente@correo.com';
    component.password = 'corta';
    component.aceptaTratamiento = true;

    component.registrar();

    const request = http.expectOne('http://localhost:3000/api/registro');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Cliente',
      correo: 'cliente@correo.com',
      password: 'corta',
      aceptaTratamiento: true,
    });
    request.flush(
      { mensaje: 'La contraseña debe tener al menos 8 caracteres.' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(component.mensaje).toBe('La contraseña debe tener al menos 8 caracteres.');
    expect(component.cargando).toBe(false);
    http.verify();
  });

  it('updates the button after a successful registration response', async () => {
    const http = TestBed.inject(HttpTestingController);
    fixture.autoDetectChanges();
    component.nombre = 'Cliente';
    component.correo = 'cliente@correo.com';
    component.password = 'ContrasenaSegura123';
    component.aceptaTratamiento = true;

    component.registrar();

    const request = http.expectOne('http://localhost:3000/api/registro');
    request.flush({ mensaje: 'Usuario registrado correctamente' });
    await fixture.whenStable();

    expect(component.cargando).toBe(false);
    expect(fixture.nativeElement.querySelector('.boton-principal')?.textContent)
      .toContain('Crear cuenta');
    http.verify();
  });

  it('does not send registration without privacy consent', () => {
    const http = TestBed.inject(HttpTestingController);
    component.nombre = 'Cliente';
    component.correo = 'cliente@correo.com';
    component.password = 'ContraseñaSegura123';

    component.registrar();

    expect(component.mensaje).toBe(
      'Debes aceptar el tratamiento de datos personales para crear una cuenta.',
    );
    expect(component.cargando).toBe(false);
    http.expectNone('http://localhost:3000/api/registro');
    http.verify();
  });

  it('explains how to restore the connection when the backend is unavailable', () => {
    const http = TestBed.inject(HttpTestingController);
    component.nombre = 'Cliente';
    component.correo = 'cliente@correo.com';
    component.password = 'ContraseñaSegura123';
    component.aceptaTratamiento = true;

    component.registrar();
    http.expectOne('http://localhost:3000/api/registro').error(
      new ProgressEvent('error'),
    );

    expect(component.mensaje).toContain('npm run start:backend');
    expect(component.cargando).toBe(false);
    http.verify();
  });

  it('stops loading and shows an error when registration times out', () => {
    vi.useFakeTimers();
    const http = TestBed.inject(HttpTestingController);
    component.nombre = 'Cliente';
    component.correo = 'cliente@correo.com';
    component.password = 'ContraseñaSegura123';
    component.aceptaTratamiento = true;

    try {
      component.registrar();
      expect(component.cargando).toBe(true);

      vi.advanceTimersByTime(15000);

      expect(component.cargando).toBe(false);
      expect(component.mensaje).toContain('El servidor tardó demasiado');
      http.verify({ ignoreCancelled: true });
    } finally {
      vi.useRealTimers();
    }
  });
});
