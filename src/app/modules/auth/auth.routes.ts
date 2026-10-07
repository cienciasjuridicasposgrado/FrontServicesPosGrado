import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { guestGuard } from '../../core/application/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
