import { HomComponentComponent } from './screens/home-component/hom-component.component';
import { Routes } from '@angular/router';
import { LoginComponentComponent } from './screens/login-component/login-component.component';
import { UserComponentComponent } from './screens/user-component/user-component.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomComponentComponent },
  { path: 'login', component: LoginComponentComponent },
  { path: 'user/:matricula', component: UserComponentComponent },
  { path: '**', redirectTo: 'home' }
];
