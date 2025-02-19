import { HomComponentComponent } from './screens/home-component/hom-component.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'hom', component: HomComponentComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '/hom' },  // Redirige cualquier ruta no encontrada a 'hom'
];
