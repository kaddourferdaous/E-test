import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Candidate {
  id: string;
  nom: string;
  email: string;
  date_inscription: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  candidates: Candidate[] = [];
  totalCandidates: number = 0;
  isLoading: boolean = false;
  error: string | null = null;
  editingCandidate: Candidate | null = null;
  editForm: any = {
    nom: '',
    email: '',
    password: ''
  };
  
  constructor(private http: HttpClient, private router: Router) {
    console.log('DashboardComponent - constructeur appelé');
  }
  
  ngOnInit(): void {
    console.log('DashboardComponent - initialisation');
    // Vérifier si le formateur est authentifié
    const token = localStorage.getItem('trainerToken');
    console.log('DashboardComponent - token formateur présent:', !!token);
    
    if (!this.isTrainerAuthenticated()) {
      console.warn('DashboardComponent - formateur non authentifié, redirection vers login');
      this.router.navigate(['/trainer-login']);
      return;
    }
    
    console.log('DashboardComponent - formateur authentifié, chargement des candidats');
    // Charger les candidats si formateur authentifié
    this.loadCandidates();
  }

  private apiUrl = 'http://localhost:5000';
  
  private isTrainerAuthenticated(): boolean {
    const token = localStorage.getItem('trainerToken');
    return !!token;
  }

  loadCandidates(): void {
    console.log('DashboardComponent - début du chargement des candidats');
    this.isLoading = true;
    this.error = null;

    // Ajouter le token d'authentification aux headers
    const token = localStorage.getItem('trainerToken');
    console.log('DashboardComponent - token utilisé pour la requête:', token ? 'présent' : 'absent');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    console.log('DashboardComponent - envoi de la requête GET pour les candidats');
    this.http.get<{ candidates: Candidate[] }>(`${this.apiUrl}/auth/candidates`, { headers }).subscribe({
      next: (response) => {
        console.log("DashboardComponent - données de candidats reçues:", response);
        this.candidates = response.candidates;
        this.totalCandidates = this.candidates.length;
        console.log(`DashboardComponent - ${this.totalCandidates} candidats chargés`);
        this.isLoading = false;
      },
      error: (err) => {
        console.error("DashboardComponent - erreur lors du chargement des candidats:", err);
        console.error("DashboardComponent - détails de l'erreur:", err.error || err.message);
        console.error("DashboardComponent - statut HTTP:", err.status);
        
        this.error = 'Erreur lors du chargement des candidats: ' + (err.error?.message || err.message);
        this.isLoading = false;
        
        // Si erreur 401, le token est invalide ou expiré
        if (err.status === 401) {
          console.warn("DashboardComponent - erreur 401, token invalide ou expiré");
          localStorage.removeItem('trainerToken');
          localStorage.removeItem('trainerId');
          localStorage.removeItem('trainerInfo');
          this.router.navigate(['/trainer-login']);
        }
      }
    });
  }
  
  logout(): void {
    console.log('DashboardComponent - déconnexion du formateur');
    localStorage.removeItem('trainerToken');
    localStorage.removeItem('trainerId');
    localStorage.removeItem('trainerInfo');
    console.log('DashboardComponent - données formateur supprimées, redirection vers login');
    this.router.navigate(['/trainer-login']);
  }
}