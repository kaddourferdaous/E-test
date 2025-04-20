import { Component, OnInit, Renderer2 } from '@angular/core';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  candidateId: string = '';
  candidateName: string = '';
  candidateEmail: string = '';
  isAuthenticated: boolean = false;
  searchQuery: string = '';
  isDark = false;

  toggleTheme() {
    this.isDark = !this.isDark;
    const body = document.body;

    if (this.isDark) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }
  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private render: Renderer2
  ) {}

  ngOnInit(): void {
    // Check authentication first and redirect if not authenticated
    if (!this.authService.checkAuthentication()) {
      console.log('L\'utilisateur n\'est pas authentifié - redirection vers login');
      this.router.navigate(['/login']);
      return; // Stop execution if not authenticated
    }
    
    // Only proceed if authenticated
    this.isAuthenticated = true;
    console.log('L\'utilisateur est authentifié');
    this.loadCandidateInfo();
  }
  
  // Rest of your component code...
  rechercher() {
    if (!this.searchQuery) return;
    // Rest of the method...
  }

  resetSearch() {
    // Rest of the method...
  }

  checkAuthentication(): void {
    this.isAuthenticated = this.authService.checkAuthentication();
    if (!this.isAuthenticated) {
      console.log('L\'utilisateur n\'est pas authentifié');
      this.router.navigate(['/login']); // Add redirect here
    } else {
      console.log('L\'utilisateur est authentifié');
    }
  }

  /**
   * Charge les informations du candidat depuis localStorage ou via une API
   */
  loadCandidateInfo(): void {
    const candidateInfo = localStorage.getItem('candidateInfo');
    
    if (candidateInfo) {
      try {
        // Parse les informations stockées dans localStorage
        const candidate = JSON.parse(candidateInfo);
        
        // Vérifie si les informations du candidat sont disponibles
        this.candidateId = candidate.id || 'Inconnu';
        this.candidateName = candidate.nom || 'Inconnu';
        this.candidateEmail = candidate.email || 'Inconnu';
        
        console.log('Informations du candidat chargées depuis localStorage:', {
          candidateId: this.candidateId,
          candidateName: this.candidateName,
          candidateEmail: this.candidateEmail
        });
      } catch (error) {
        console.error('Erreur lors du chargement des informations du candidat depuis localStorage:', error);
      }
    } else {
      console.log('Aucune information de candidat trouvée dans localStorage.');
      // Si les informations ne sont pas dans localStorage, récupérez-les via l'API

    }
  }

  /**
   * Récupère les informations du candidat via l'API si elles ne sont pas dans localStorage
   */
 

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this.authService.logout();
    this.candidateId = '';
    this.candidateName = '';
    this.candidateEmail = '';
    this.isAuthenticated = false;
    console.log('Déconnexion réussie');
    this.router.navigate(['/login']);  // Redirigez l'utilisateur vers la page de connexion
  }
}