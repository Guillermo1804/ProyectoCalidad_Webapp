import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FacadeServiceService } from '../../services/facade.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
declare var $:any;

@Component({
  selector: 'app-login-component',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './login-component.component.html',
  styleUrl: './login-component.component.scss'
})
export class LoginComponentComponent {
  public email: string = "";
  public passmatricula:string = "";
  public type: String = "password";
  public errors: any={};


constructor(
private router: Router,
private facadeServiceService: FacadeServiceService
){}

ngOnInit(
){}

public login() {

  this.errors = [];

  this.errors = this.facadeServiceService.validarLogin(this.email, this.passmatricula);
  if (Object.keys(this.errors).length > 0) {
    console.log('Errores encontrados:', this.errors);
    return false;
  }

  this.facadeServiceService.login(this.email, this.passmatricula).subscribe({
    next: (response) => {
      this.facadeServiceService.saveUserData(response);
      this.router.navigate(["home"]);
    },
    error: (error) => {
      console.error('Error al iniciar sesión:', error);
      // Mostrar el mensaje de error específico
      if (error.error && error.error.non_field_errors) {
        alert(error.error.non_field_errors[0]);
      } else {
        alert("No se pudo iniciar sesión");
      }
    }
  });
  return true;
}

}

