import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TrainerGuard implements CanActivate {

  constructor(private router: Router,private authService:AuthService) {}

  canActivate(): boolean {
    console.group('[TrainerGuard] Vérification session');
    this.authService.printTrainerSessionInfo();
    
    const isAuth = this.authService.checkTrainerAuthentication();
    console.log('Authentifié:', isAuth);
    
    console.groupEnd();
    
    if (!isAuth) {
      this.router.navigate(['/trainerLogin']);
    }
    return isAuth;
  }
  
  private isTrainerAuthenticated(): boolean {
    const token = localStorage.getItem('trainerToken');
    return !!token; // Retourne true si un token existe
  }
}