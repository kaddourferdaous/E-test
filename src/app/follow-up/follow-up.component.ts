import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateService } from '../candidate.service';

@Component({
  selector: 'app-follow-up',
  templateUrl: './follow-up.component.html',
  styleUrls: ['./follow-up.component.css']
})
export class FollowUpComponent implements OnInit {
  // URL globale de l'API
  private apiUrl = 'https://training-backend-1pda.onrender.com';
  
  followUpForm!: FormGroup;
  trainerId!: string | null;
  scores: any;
  showScores: boolean = false;
  scoreOptions = [1, 2, 3, 4, 5];
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private candidateService: CandidateService
  ) {}
  
  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialise le formulaire avec les données nécessaires
   */
  private initializeForm(): void {
    // Récupération de l'ID du formateur
    this.trainerId = this.getTrainerId();
    if (!this.trainerId) {
      console.error('Erreur : ID du formateur non disponible.');
      alert('Erreur : Impossible de récupérer l\'ID du formateur.');
      return;
    }
    
    // Récupération de l'ID du candidat
    const candidateId = localStorage.getItem('selectedCandidateId');
    if (!candidateId) {
      console.error('Erreur : ID du candidat non disponible.');
      alert('Erreur : Impossible de récupérer l\'ID du candidat.');
      return;
    }
    
    console.log('Retrieved candidateId from localStorage:', candidateId);
    
    // Initialisation du formulaire avec validation
    this.followUpForm = this.fb.group({
      id_trainer: [this.trainerId, [Validators.required]],
      id_candidate: [candidateId, [Validators.required]],
      
      // Speed
      speed_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      speed_remark: [''],
      
      // Quality
      quality_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      quality_remark: [''],
      
      // EHS Rules Respect
      ehs_rules_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      ehs_rules_respect_remark: [''],
      
      // Presence Respect
      presence_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      presence_respect_remark: [''],
      
      // LL Instruction Respect
      ll_instruction_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      ll_instruction_respect_remark: [''],
      
      // Time Management Respect
      time_management_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      time_management_respect_remark: [''],
      
      // Memory
      memory_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      memory_remark: [''],
      
      // Logic
      logic_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      logic_remark: [''],
      
      // Motivation
      motivation_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      motivation_remark: [''],
      
      // General Score (calculé automatiquement)
      score: [0, [Validators.required, Validators.min(9), Validators.max(45)]]
    });

    // Configuration du calcul automatique du score général
    this.setupAutomaticScoreCalculation();
    
    // Nettoyage du localStorage après récupération de l'ID
    localStorage.removeItem('selectedCandidateId');
  }

  /**
   * Configure le calcul automatique du score général
   */
  private setupAutomaticScoreCalculation(): void {
    const scoreControls = [
      'speed_score',
      'quality_score',
      'ehs_rules_respect_score',
      'presence_respect_score',
      'll_instruction_respect_score',
      'time_management_respect_score',
      'memory_score',
      'logic_score',
      'motivation_score'
    ];
  
    // Fonction pour calculer et mettre à jour le score total
    const updateTotalScore = (): void => {
      const totalScore = scoreControls.reduce((sum, controlName) => {
        const control = this.followUpForm.get(controlName);
        const value = control?.value;
        
        // Convertir la valeur en nombre et ignorer les valeurs invalides
        const numericValue = Number(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue > 5) {
          return sum; // Ne pas inclure cette valeur dans le calcul
        }
        
        return sum + numericValue;
      }, 0);
      
      // Mettre à jour le champ "score" avec la somme calculée
      this.followUpForm.get('score')?.setValue(totalScore, { emitEvent: false });
    };
  
    // Calcul initial du score
    updateTotalScore();
    
    // Abonnement aux changements dans les contrôles de score
    scoreControls.forEach(controlName => {
      const control = this.followUpForm.get(controlName);
      if (control) {
        control.valueChanges.subscribe(() => {
          updateTotalScore();
        });
      }
    });
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    console.group('[Soumission du Formulaire Follow-Up]');
    console.log('État actuel du formulaire:', this.followUpForm);

    // Vérifier si le formulaire est valide
    if (this.followUpForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.followUpForm.value;
      console.log('Données du formulaire préparées pour envoi:', formData);

      // Appel de l'API Flask avec HttpClient utilisant l'URL globale
      this.http.post(`${this.apiUrl}/eval/trainer/followUp/evaluations`, formData)
        .subscribe({
          next: (response) => {
            console.log('Réponse du serveur:', response);
            alert('Évaluation de suivi enregistrée avec succès!');
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Erreur lors de la soumission:', error);
            const errorMessage = error.error?.message || error.message || 'Erreur inconnue';
            alert(`Erreur lors de l'enregistrement: ${errorMessage}`);
            this.isSubmitting = false;
          }
        });
    } else {
      // Afficher les erreurs de validation
      console.error('Le formulaire est invalide.');
      console.error('Erreurs de validation:', this.getFormErrors(this.followUpForm));
      
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.markFormGroupTouched(this.followUpForm);
      
      alert('Veuillez remplir tous les champs obligatoires correctement.');
    }
    console.groupEnd();
  }

  /**
   * Remet le formulaire à zéro
   */
  private resetForm(): void {
    const candidateId = localStorage.getItem('selectedCandidateId');
    this.followUpForm.reset();
    
    // Rétablir les valeurs par défaut
    this.followUpForm.patchValue({
      id_trainer: this.trainerId,
      id_candidate: candidateId || '',
      score: 0
    });
  }

  /**
   * Marque tous les champs du formulaire comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Récupère les erreurs de validation du formulaire
   * @param formGroup Le groupe de formulaires à inspecter
   * @returns Un objet contenant les erreurs pour chaque champ
   */
  private getFormErrors(formGroup: FormGroup): { [key: string]: any } {
    const errors: { [key: string]: any } = {};

    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control?.invalid) {
        errors[key] = {
          value: control.value,
          errors: control.errors
        };
      }
    });

    return errors;
  }

  /**
   * Récupère l'ID du formateur connecté depuis le localStorage
   */
  private getTrainerId(): string | null {
    return localStorage.getItem('trainerId'); // Ou sessionStorage selon votre implémentation
  }

  /**
   * Bascule l'affichage des scores
   */
  toggleScores(): void {
    this.showScores = !this.showScores;
  }

  /**
   * Vérifie si un champ spécifique a des erreurs
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.followUpForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Récupère le message d'erreur pour un champ spécifique
   */
  getFieldErrorMessage(fieldName: string): string {
    const field = this.followUpForm.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return `${fieldName} is required`;
    }
    if (field.errors['min']) {
      return `${fieldName} must be at least ${field.errors['min'].min}`;
    }
    if (field.errors['max']) {
      return `${fieldName} must be at most ${field.errors['max'].max}`;
    }

    return 'Invalid value';
  }

  /**
   * Récupère la valeur actuelle du score général
   */
  get currentGeneralScore(): number {
    return this.followUpForm.get('score')?.value || 0;
  }

  /**
   * Calcule le score maximal possible (9 critères × 5 points = 45)
   */
  get maxPossibleScore(): number {
    return 45;
  }
}