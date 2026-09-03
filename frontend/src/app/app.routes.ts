import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { SignupComponent } from './features/auth/signup.component';
export const routes: Routes = [
  {path: 'login', component: LoginComponent}, {path: 'signup', component: SignupComponent}, {path: '', pathMatch: 'full', redirectTo: 'login'}, {path: '**', redirectTo: 'login'}
];
