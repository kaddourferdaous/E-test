import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Route, Router } from '@angular/router';
import { CandidateService } from '../candidate.service';

// Interface mise à jour pour refléter la structure de la réponse attendue
interface Candidate {
  id: string; // Correspond à _id dans la réponse
  nom: string;
  prenom: string;
  tel: string;
  email: string; // Correspond à mail dans la réponse
  genre: string;
  groupe: string;
  groupe_date: string;
  starting_trainee_date: string;
}

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.css']
})

export class CandidatesComponent implements OnInit {
 

  candidates: Candidate[] = [];
  totalCandidates: number = 0; // Pour stocker le total de candidats
  isLoading: boolean = false;
  error: string | null = null;
  editingCandidate: Candidate | null = null;
  editForm: any = {
    nom: '',
    email: '',
    password: '' // Optionnel pour la mise à jour
  };
  filteredCandidates: Candidate[] = [];
  
  searchTerm = '';
  selectedDateFilter: 'today' | 'week' | 'month' | 'custom' | 'none' = 'none';
  customDateRange = {
    start: '',
    end: ''
  };
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient,private router:Router,private candidateService:CandidateService) {}

  ngOnInit(): void {
    console.log("Initialisation du composant CandidatesComponent...");
    this.loadCandidates();
    // La ligne this.resetFilters() est déjà commentée, ce qui est correct
  }
  
  openAddSurveyModal(candidateId: string): void {
    const isConfirmed = window.confirm(`Are you sure you want to add a survey for candidate ID ${candidateId}?`);
    if (isConfirmed) {
      console.log("Redirection vers la page des enquêtes avec l'ID du candidat :", candidateId);
      localStorage.setItem('selectedCandidateId', candidateId);
      this.router.navigate(['/surveys']);
    }
  }
  
  viewAllCandidates(): void {
    // Reset filters and display all candidates
    this.resetFilters();
    // Reset date filter selection
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

  // Méthode pour récupérer les candidats par ID de formateur
  getCandidatsByTrainerId(): Observable<any> {
    const trainerId = this.getTrainerId(); // Récupérer l'ID du formateur
    if (!trainerId) {
      console.error("ID du formateur non disponible. Impossible de charger les candidats.");
      throw new Error("ID du formateur non disponible");
    }
    console.log("Appel API pour récupérer les candidats du formateur avec ID :", trainerId);
    
    // Vérifiez que cette ligne est exécutée
    console.log("Déclenchement de l'appel HTTP...");
    return this.http.get<any>(`${this.apiUrl}/candidat/get_candidats_by_trainer/${trainerId}`);
  }

  loadCandidates(): void {
    console.log("Chargement des candidats...");
    this.isLoading = true;
    this.error = null;

    // Appeler la méthode getCandidatsByTrainerId() pour charger les candidats
    this.getCandidatsByTrainerId().subscribe({
      next: (response) => {
        console.log("Réponse brute de l'API :", response);

        // Vérifier si la réponse contient des données
        if (!response || response.length === 0) {
          console.warn("Aucun candidat trouvé pour ce formateur.");
          this.candidates = [];
          this.totalCandidates = 0;
          this.isLoading = false;
          return;
        }

        // Mapper les données reçues pour correspondre à l'interface Candidate
        console.log("Mapping des données des candidats...");
        this.candidates = response.map((candidate: any) => ({
          id: candidate._id,
          nom: candidate.nom,
          prenom: candidate.prenom,
          tel: candidate.tel,
          email: candidate.mail, // Mapping de mail vers email
          genre: candidate.genre,
          groupe: candidate.groupe,
          groupe_date: candidate.groupe_date,
          starting_trainee_date: candidate.starting_trainee_date
        }));

        console.log("Candidats mappés :", this.candidates);

        this.totalCandidates = this.candidates.length;
        this.isLoading = false;
        
        // Initialiser filteredCandidates avec tous les candidats après le chargement
        this.filteredCandidates = [...this.candidates];
      },
      error: (err) => {
        console.error("Erreur lors de l'appel API :", err);
        this.error = 'Erreur lors du chargement des candidats: ' + (err.error?.message || err.message);
        this.isLoading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Date non disponible';

    try {
      // Convertir la chaîne ISO en objet Date
      const date = new Date(dateStr);

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn("Date invalide détectée :", dateStr);
        return 'Date invalide';
      }

      // Formater la date pour l'affichage
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

  deleteCandidate(candidateId: string): void {
    console.log("Tentative de suppression du candidat avec ID :", candidateId);

    // Vérification que l'ID n'est pas undefined ou vide
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
          // Filtrer le candidat supprimé de la liste
          this.candidates = this.candidates.filter(c => c.id !== candidateId);
          // Mettre à jour également filteredCandidates
          this.filteredCandidates = this.filteredCandidates.filter(c => c.id !== candidateId);
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
      password: '' // Le champ de mot de passe est vide par défaut
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

    // Ne pas envoyer le mot de passe s'il est vide
    const updateData = { ...this.editForm };
    if (!updateData.password) {
      delete updateData.password;
    }

    this.http.put(`${this.apiUrl}/auth/candidate/${this.editingCandidate.id}`, updateData).subscribe({
      next: (response: any) => {
        console.log("Réponse de mise à jour :", response);

        // Mettre à jour le candidat dans la liste locale
        const index = this.candidates.findIndex(c => c.id === this.editingCandidate?.id);
        if (index !== -1) {
          this.candidates[index] = {
            ...this.candidates[index],
            nom: this.editForm.nom,
            email: this.editForm.email
          };
          
          // Mettre à jour également dans filteredCandidates
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
    
    // Set default date range for custom filter if not already set
    if (filter === 'custom' && !this.customDateRange.start) {
      const today = new Date();
      this.customDateRange.end = today.toISOString().split('T')[0];
      
      // Default start date to 1 month ago
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
    this.filteredCandidates = [...this.candidates]; // Copie complète des candidats
    console.log("Filtres réinitialisés. Candidats filtrés :", this.filteredCandidates);
  }

  applyFilters(): Candidate[] {
    let filtered = [...this.candidates];
    
    // Apply search filter if there's a search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(candidate =>
        candidate.nom.toLowerCase().includes(term) ||
        candidate.prenom.toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term)
      );
    }
    
    // Apply date filter based on selection
    if (this.selectedDateFilter !== 'none') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (this.selectedDateFilter) {
        case 'today':
          filtered = filtered.filter(candidate => {
            const groupDate = new Date(candidate.groupe_date);
            groupDate.setHours(0, 0, 0, 0);
            return groupDate.getTime() === today.getTime();
          });
          break;
          
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // Sunday as first day
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          filtered = filtered.filter(candidate => {
            const groupDate = new Date(candidate.groupe_date);
            return groupDate >= weekStart && groupDate <= weekEnd;
          });
          break;
          
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
          filtered = filtered.filter(candidate => {
            const groupDate = new Date(candidate.groupe_date);
            return groupDate >= monthStart && groupDate <= monthEnd;
          });
          break;
          
        case 'custom':
          if (this.customDateRange.start && this.customDateRange.end) {
            const startDate = new Date(this.customDateRange.start);
            const endDate = new Date(this.customDateRange.end);
            endDate.setHours(23, 59, 59, 999); // Include the entire end day
            
            filtered = filtered.filter(candidate => {
              const groupDate = new Date(candidate.groupe_date);
              return groupDate >= startDate && groupDate <= endDate;
            });
          }
          break;
      }
    }
    
    this.filteredCandidates = filtered;
    return filtered;
  }
}