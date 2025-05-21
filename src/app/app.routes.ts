import { HomComponentComponent } from './screens/home-component/hom-component.component';
import { Routes } from '@angular/router';
import { LoginComponentComponent } from './screens/login-component/login-component.component';
import { UserComponentComponent } from './screens/user-component/user-component.component';
import { RegisterPageComponent } from './screens/register-page/register-page.component'; // Added import
import { DashboardComponent } from './screens/dashboard/dashboard.component'; // Added new import

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponentComponent },
  { path: 'home', component: HomComponentComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'dashboard', component: DashboardComponent }, // Added new route
  { path: '**', redirectTo: '/login' } // Ruta comodín para redirigir a login si no se encuentra la ruta
];
