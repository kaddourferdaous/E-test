import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Candidate {
  id: number;
  nom: string;
  prenom: string;
  score: number;
  statut?: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settingsForm: FormGroup;
  currentThreshold!: number;
  acceptanceThreshold!: number;
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' | '' = '';
  
  // Données des candidats
  allCandidates: Candidate[] = [];
  acceptedCandidates: Candidate[] = [];

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder
  ) {
    // Initialiser avec une valeur temporaire, sera mise à jour dans ngOnInit
    this.settingsForm = this.formBuilder.group({
      threshold: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentThreshold();
    this.loadCandidates();
  }

  loadCurrentThreshold() {
    this.isLoading = true;
    this.http.get<any>('https://training-backend-1pda.onrender.com/api/settings/threshold')
      .subscribe({
        next: (response) => {
          this.currentThreshold = response.threshold;
          this.acceptanceThreshold = response.threshold;
          this.settingsForm.patchValue({ threshold: response.threshold });
          this.filterAcceptedCandidates();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du seuil:', error);
          this.showMessage('Erreur lors du chargement du seuil', 'error');
          this.isLoading = false;
        }
      });
  }

  loadCandidates(): void {
    this.http.get<Candidate[]>('https://training-backend-1pda.onrender.com/auth/candidates')
      .subscribe({
        next: (candidates) => {
          this.allCandidates = candidates;
          this.filterAcceptedCandidates();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des candidats:', error);
          this.showMessage('Erreur lors du chargement des candidats', 'error');
        }
      });
  }

  filterAcceptedCandidates(): void {
    this.acceptedCandidates = this.allCandidates.filter(candidate => 
      candidate.score >= this.acceptanceThreshold
    );
  }

  updateThreshold(): void {
    if (this.settingsForm.valid) {
      this.isLoading = true;
      const newThreshold = this.settingsForm.get('threshold')?.value;

      this.http.put<any>('https://training-backend-1pda.onrender.com/api/settings/threshold', { threshold: newThreshold })
        .subscribe({
          next: (response) => {
            this.currentThreshold = newThreshold;
            this.acceptanceThreshold = newThreshold;
            this.filterAcceptedCandidates();
            this.showMessage(`Seuil mis à jour avec succès: ${this.acceptanceThreshold}%`, 'success');
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour:', error);
            this.showMessage('Erreur lors de la mise à jour du seuil', 'error');
            this.isLoading = false;
          }
        });
    }
  }

  onThresholdChange(): void {
    const formThreshold = this.settingsForm.get('threshold')?.value;
    if (formThreshold !== null && formThreshold !== undefined) {
      this.acceptanceThreshold = formThreshold;
      this.filterAcceptedCandidates();
    }
  }

  resetToDefault(): void {
    // Utiliser la valeur actuelle du serveur au lieu d'une valeur codée en dur
    this.settingsForm.patchValue({ threshold: this.currentThreshold });
    this.acceptanceThreshold = this.currentThreshold;
    this.filterAcceptedCandidates();
  }

  // Nouvelle méthode pour obtenir la valeur actuelle du seuil
  getCurrentAcceptanceThreshold(): number {
    return this.acceptanceThreshold;
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 3000);
  }
}