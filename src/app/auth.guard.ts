import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    console.log('AuthGuard - vérification d\'authentification');
    const isAuthenticated = this.authService.checkAuthentication();
    console.log('AuthGuard - est authentifié:', isAuthenticated);
    
    if (isAuthenticated) {
      return true; // L'utilisateur est authentifié, autoriser l'accès
    } else {
      console.log('AuthGuard - redirection vers login');
      this.router.navigate(['/login']); // Rediriger vers la page de connexion
      return false; // Bloquer l'accès
    }
  }
}