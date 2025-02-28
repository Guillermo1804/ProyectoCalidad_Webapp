import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-component',
  standalone: true,
  imports: [

  ],
  templateUrl: './login-component.component.html',
  styleUrl: './login-component.component.scss'
})
export class LoginComponentComponent {

constructor(
private router: Router,
){}

ngOnInit(
){}

public login(){
  this.router.navigate(["home"]);
}

irARegistro() {
  this.router.navigate(['/registro']);
}

}

