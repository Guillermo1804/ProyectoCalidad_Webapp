import { RegistrarEntradaComponentComponent } from './screens/registrar-entrada-component/registrar-entrada-component.component';
import { RegisterComponentComponent } from './screens/register-component/register-component.component';
import { HomComponentComponent } from './screens/home-component/hom-component.component';
import { Routes } from '@angular/router';
import { LoginComponentComponent } from './screens/login-component/login-component.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomComponentComponent },
  { path: 'login', component: LoginComponentComponent },
  //{ path: '**', redirectTo: 'home' },
  { path: 'registro', component: RegisterComponentComponent },
  { path: 'registrar-entrada', component: RegistrarEntradaComponentComponent }
];
