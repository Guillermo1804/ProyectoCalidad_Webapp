import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FacadeServiceService, UserRegistrationData } from '../../services/facade.service'; // Import service and interface
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // For notifications
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For loading indicator

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule, 
    RouterModule, 
    MatSnackBarModule, // Add MatSnackBarModule
    MatProgressSpinnerModule // Add MatProgressSpinnerModule
  ],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent {
  userData = {
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private facadeService: FacadeServiceService,
    private snackBar: MatSnackBar
  ) {}

  register() {
    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    this.errorMessage = null;
    this.isLoading = true;

    const registrationData: UserRegistrationData = {
      username: this.userData.email, // Using email as username, adjust if needed
      email: this.userData.email,
      password: this.userData.password,
      first_name: this.userData.nombre,
      last_name: `${this.userData.apellidoPaterno} ${this.userData.apellidoMaterno}`.trim()
    };

    this.facadeService.registerUser(registrationData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration successful:', response);
        this.snackBar.open('¡Registro exitoso! Serás redirigido al inicio de sesión.', 'Cerrar', {
          duration: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
        console.error('Registration error:', err);
        this.snackBar.open(this.errorMessage || 'Error en el registro', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'] // Optional: for custom styling
        });
      }
    });
  }
}
