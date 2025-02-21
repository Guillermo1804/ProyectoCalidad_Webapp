import { HomComponentComponent } from './screens/home-component/hom-component.component';
import { Routes } from '@angular/router';
import { LoginComponentComponent } from './screens/login-component/login-component.component';

export const routes: Routes = [
  //{ path: '', redirectTo: 'home' },  // Redirige cualquier ruta no encontrada a 'hom'
  { path: 'home', component: HomComponentComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponentComponent, pathMatch: 'full' },


];
