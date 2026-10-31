import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends login credentials and displays the server response', async () => {
    const http = TestBed.inject(HttpTestingController);
    fixture.autoDetectChanges();
    component.correo = 'cliente@correo.com';
    component.password = 'contrasena123';

    component.iniciarSesion();

    const request = http.expectOne('http://localhost:3000/api/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      correo: 'cliente@correo.com',
      password: 'contrasena123',
    });
    request.flush({
      mensaje: 'Inicio de sesión correcto',
      usuario: { id: 1, nombre: 'Cliente', correo: 'cliente@correo.com' },
    });

    await fixture.whenStable();

    expect(component.mensaje).toBe('¡Bienvenido, Cliente!');
    expect(component.cargando).toBe(false);
    expect(fixture.nativeElement.querySelector('.boton-principal')?.textContent)
      .toContain('Iniciar sesión');
    http.verify();
  });
});
