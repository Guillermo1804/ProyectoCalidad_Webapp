import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register-component',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './register-component.component.html',
  styleUrl: './register-component.component.scss'
})
export class RegisterComponentComponent {

  // Objeto que almacena los datos del formulario
  user = {
    username: '',
    matricula: '',
    password: '',
    confirmPassword: ''
  };

  constructor() { }

  isSubmitted = false; // Para rastrear si el usuario intentó enviar el formulario
  passwordsMatch = true;

  register(): void {
    this.isSubmitted = true;

    // Validación: Si hay campos vacíos, no proceder
    if (!this.user.username || !this.user.matricula || !this.user.password || !this.user.confirmPassword) {
      console.error('Faltan campos por llenar.');
      return;
    }

    // Validar que las contraseñas coincidan
    this.passwordsMatch = this.user.password === this.user.confirmPassword;

    if (!this.passwordsMatch) {
      console.error('Las contraseñas no coinciden.');
      return;
    }

  console.log('Usuario registrado', this.user);

    // Validar que las contraseñas coincidan
    if (this.user.password !== this.user.confirmPassword) {
      console.error('Las contraseñas no coinciden.');
      return;
    }

    console.log('Usuario registrado', this.user);
  }



}
