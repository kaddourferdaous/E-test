import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { CandidateService } from '../candidate.service';

// Interface mise à jour pour refléter la structure exacte des candidats retournés par l'API Flask
interface Candidate {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  user_type: string;
  contract_signed_date: string;
}

interface CandidateInfo {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  user_type: string;
  contract_signed_date: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  niveau?: string;
  filiere?: string;
  etablissement?: string;
}

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.css']
})
export class CandidatesComponent implements OnInit {
  isSidebarOpen: boolean = true; // Initialisé à true pour sidebar ouverte
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
  filteredCandidates: Candidate[] = [];
  searchTerm = '';
  selectedDateFilter: 'today' | 'week' | 'month' | 'custom' | 'none' = 'none';
  customDateRange = {
    start: '',
    end: ''
  };
  private apiUrl = "https://training-backend-1pda.onrender.com";

  constructor(
    private http: HttpClient,
    private router: Router,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    console.log("Initialisation du composant CandidatesComponent...");
    this.loadCandidates();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    console.log("Sidebar toggled, isSidebarOpen:", this.isSidebarOpen);
  }

  openAddSurveyModal(candidateId: string): void {
    const isConfirmed = window.confirm(`Are you sure you want to add a survey for candidate ID ${candidateId}?`);
    if (isConfirmed) {
      console.log("Redirection vers la page des enquêtes avec l'ID du candidat :", candidateId);
      localStorage.setItem('selectedCandidateId', candidateId);
      this.router.navigate(['/surveys']);
    }
  }

 viewCandidateDetails(candidate: Candidate): void {
  console.log("Affichage des détails du candidat :", candidate);
  
  // Stocker les informations du candidat sélectionné
  const candidateInfo = this.formatCandidateInfo(candidate);
  localStorage.setItem('candidateInfo', JSON.stringify(candidateInfo));
  localStorage.setItem('selectedCandidateId', candidate.id.toString());
  
  // Navigation vers la page profil avec l'ID du candidat
  this.router.navigate([`/candidate-profile/${candidate.id}`]);
}

  async fetchCandidateFromAPI(candidateId: string): Promise<void> {
    const headers = this.getHttpHeaders();
    if (!candidateId) {
      throw new Error('ID du candidat non trouvé');
    }

    try {
      const url = `${this.apiUrl}/auth/candidate/${candidateId}`;
      console.log('CandidatesComponent - URL pour les données candidat:', url);
      
      const response = await this.http.get<any>(url, { headers }).toPromise();
      
      if (response && response.success && response.candidate) {
        const candidateInfo = this.formatCandidateInfo(response.candidate);
        console.log('CandidatesComponent - données candidat récupérées depuis l\'API:', candidateInfo);
        localStorage.setItem('candidateInfo', JSON.stringify(candidateInfo));
      } else {
        throw new Error('Réponse API invalide ou aucun candidat trouvé');
      }
    } catch (error) {
      console.warn('CandidatesComponent - endpoint candidat non disponible:', error);
      throw error;
    }
  }

  private formatCandidateInfo(candidate: any): CandidateInfo {
    return {
      id: candidate.id?.toString() || 'N/A',
      matricule: candidate.matricule || 'N/A',
      nom: candidate.nom || 'Non disponible',
      prenom: candidate.prenom || 'Non disponible',
      email: candidate.email || 'Email non disponible',
      user_type: candidate.user_type || 'trainee',
      contract_signed_date: candidate.contract_signed_date || 'Non renseignée',
      telephone: candidate.tele || candidate.telephone || 'Non renseigné',
      adresse: candidate.Adresse_sur_Tanger || candidate.adresse || 'Non renseignée',
      dateNaissance: candidate.date_naissance || candidate.dateNaissance || 'Non renseignée',
      niveau: candidate.Niveau_etude || candidate.niveau || 'Non renseigné',
      filiere: candidate.filiere || candidate.speciality || 'Non renseignée',
      etablissement: candidate.etablissement || candidate.school || 'Non renseigné'
    };
  }

  private getHttpHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = localStorage.getItem('trainerToken');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  viewAllCandidates(): void {
    this.resetFilters();
    this.selectedDateFilter = 'none';
  }

  getTrainerId(): string | null {
    console.log("Récupération de l'ID du formateur depuis localStorage...");
    const trainerId = localStorage.getItem('trainerId');
    if (!trainerId) {
      console.error("Erreur : Aucun formateur connecté trouvé.");
      alert("Vous devez être connecté en tant que formateur pour accéder à cette page.");
      return null;
    }
    console.log("ID du formateur récupéré :", trainerId);
    return trainerId;
  }

  getCandidatsByTrainerId(): Observable<Candidate[]> {
    const trainerId = this.getTrainerId();
    if (!trainerId) {
      console.error("ID du formateur non disponible. Impossible de charger les candidats.");
      throw new Error("ID du formateur non disponible");
    }
    console.log("Appel API pour récupérer les candidats...");
    return this.http.get<Candidate[]>(`${this.apiUrl}/auth/candidates`);
  }

  loadCandidates(): void {
    console.log("Chargement des candidats...");
    this.isLoading = true;
    this.error = null;

    this.getCandidatsByTrainerId().subscribe({
      next: (candidates: Candidate[]) => {
        console.log("Candidats reçus :", candidates);

        if (!candidates || candidates.length === 0) {
          console.warn("Aucun candidat trouvé.");
          this.candidates = [];
          this.totalCandidates = 0;
          this.filteredCandidates = [];
          this.isLoading = false;
          return;
        }

        this.candidates = candidates;
        this.totalCandidates = candidates.length;
        this.filteredCandidates = [...this.candidates];
        this.isLoading = false;
        console.log("Candidats chargés avec succès :", this.candidates.length);
      },
      error: (err) => {
        console.error("Erreur lors de l'appel API :", err);
        this.error = 'Erreur lors du chargement des candidats: ' + (err.error?.message || err.message);
        this.isLoading = false;
        this.candidates = [];
        this.filteredCandidates = [];
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Date non disponible';

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn("Date invalide détectée :", dateStr);
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Erreur de formatage de date :", e, dateStr);
      return 'Erreur date';
    }
  }

  deleteCandidate(candidateId: number): void {
    console.log("Tentative de suppression du candidat avec ID :", candidateId);

    if (!candidateId) {
      console.error("ID du candidat invalide.");
      alert("Erreur: Impossible de supprimer ce candidat car son ID est invalide");
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
      console.log("Appel API pour supprimer le candidat avec ID :", candidateId);
      this.http.delete(`${this.apiUrl}/auth/candidate/${candidateId}`).subscribe({
        next: (response) => {
          console.log("Réponse de suppression :", response);
          this.candidates = this.candidates.filter(c => c.id !== candidateId);
          this.filteredCandidates = this.filteredCandidates.filter(c => c.id !== candidateId);
          this.totalCandidates = this.candidates.length;
          alert('Candidat supprimé avec succès');
        },
        error: (err) => {
          console.error("Erreur lors de la suppression :", err);
          alert('Erreur lors de la suppression: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  startEditing(candidate: Candidate): void {
    console.log("Début de l'édition du candidat :", candidate);
    this.editingCandidate = { ...candidate };
    this.editForm = {
      nom: candidate.nom,
      email: candidate.email,
      password: ''
    };
  }

  cancelEditing(): void {
    console.log("Annulation de l'édition du candidat...");
    this.editingCandidate = null;
  }

  updateCandidate(): void {
    if (!this.editingCandidate) {
      console.error("Aucun candidat en cours d'édition.");
      return;
    }

    console.log("Mise à jour du candidat avec ID :", this.editingCandidate.id);

    const updateData = { ...this.editForm };
    if (!updateData.password) {
      delete updateData.password;
    }

    this.http.put(`${this.apiUrl}/auth/candidate/${this.editingCandidate.id}`, updateData).subscribe({
      next: (response: any) => {
        console.log("Réponse de mise à jour :", response);

        const index = this.candidates.findIndex(c => c.id === this.editingCandidate?.id);
        if (index !== -1) {
          this.candidates[index] = {
            ...this.candidates[index],
            nom: this.editForm.nom,
            email: this.editForm.email
          };

          const filteredIndex = this.filteredCandidates.findIndex(c => c.id === this.editingCandidate?.id);
          if (filteredIndex !== -1) {
            this.filteredCandidates[filteredIndex] = {
              ...this.filteredCandidates[filteredIndex],
              nom: this.editForm.nom,
              email: this.editForm.email
            };
          }
        }
        this.editingCandidate = null;
        alert('Candidat mis à jour avec succès');
      },
      error: (err) => {
        console.error("Erreur lors de la mise à jour :", err);
        alert('Erreur lors de la mise à jour: ' + (err.error?.message || err.message));
      }
    });
  }

  setDateFilter(filter: 'today' | 'week' | 'month' | 'custom' | 'none'): void {
    this.selectedDateFilter = filter;

    if (filter === 'custom' && !this.customDateRange.start) {
      const today = new Date();
      this.customDateRange.end = today.toISOString().split('T')[0];
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      this.customDateRange.start = oneMonthAgo.toISOString().split('T')[0];
    }

    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedDateFilter = 'none';
    this.customDateRange = {
      start: '',
      end: ''
    };
    this.filteredCandidates = [...this.candidates];
    console.log("Filtres réinitialisés. Candidats filtrés :", this.filteredCandidates);
  }

  applyFilters(): Candidate[] {
    let filtered = [...this.candidates];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(candidate =>
        candidate.nom.toLowerCase().includes(term) ||
        candidate.prenom.toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term) ||
        (candidate.matricule && candidate.matricule.toLowerCase().includes(term))
      );
    }

    if (this.selectedDateFilter !== 'none') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(candidate => {
        if (!candidate.contract_signed_date) return false;
        const contractDate = new Date(candidate.contract_signed_date);
        if (isNaN(contractDate.getTime())) return false;

        switch (this.selectedDateFilter) {
          case 'today':
            return contractDate.toDateString() === today.toDateString();
          case 'week':
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            return contractDate >= oneWeekAgo && contractDate <= today;
          case 'month':
            const oneMonthAgo = new Date(today);
            oneMonthAgo.setMonth(today.getMonth() - 1);
            return contractDate >= oneMonthAgo && contractDate <= today;
          case 'custom':
            if (!this.customDateRange.start || !this.customDateRange.end) return true;
            const startDate = new Date(this.customDateRange.start);
            const endDate = new Date(this.customDateRange.end);
            return contractDate >= startDate && contractDate <= endDate;
          default:
            return true;
        }
      });
    }

    this.filteredCandidates = filtered;
    return filtered;
  }

  logout(): void {
    console.log('CandidatesComponent - déconnexion du formateur');
    localStorage.removeItem('trainerToken');
    localStorage.removeItem('trainerId');
    localStorage.removeItem('trainerInfo');
    console.log('CandidatesComponent - données formateur supprimées, redirection vers login');
    this.router.navigate(['/trainerLogin']);
  }
  
}