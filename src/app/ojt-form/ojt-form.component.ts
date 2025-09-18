import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateService } from '../candidate.service';

@Component({
  selector: 'app-ojt-form',
  templateUrl: './ojt-form.component.html',
  styleUrls: ['./ojt-form.component.css']
})
export class OjtFormComponent implements OnInit {
  ojtForm!: FormGroup;
  trainerId!: string | null;
  scores: any;
  showScores: boolean = false;
  scoreOptions: number[] = [1, 2, 3, 4, 5];
  private apiUrl = 'https://training-backend-1pda.onrender.com';

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID du formateur
    this.trainerId = this.getTrainerId();
    if (!this.trainerId) {
      console.error('Erreur : ID du formateur non disponible.');
      alert('Erreur : Impossible de récupérer l\'ID du formateur.');
      return;
    }

    // Récupérer l'ID du candidat depuis localStorage
    const candidateId = localStorage.getItem('selectedCandidateId');
    if (candidateId) {
      console.log('ID du candidat récupéré depuis localStorage:', candidateId);
    } else {
      console.warn('Aucun ID de candidat trouvé dans localStorage');
    }

    // Initialiser le formulaire avec des valeurs par défaut
    this.ojtForm = this.fb.group({
      id_trainer: [this.trainerId, Validators.required],
      id_candidate: [candidateId || '', Validators.required],

      // Vitesse
      speed_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      speed_remark: [''],

      // Qualité
      quality_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      quality_remark: [''],

      // Respect des règles EHS
      ehs_rules_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      ehs_rules_respect_remark: [''],

      // Respect de la présence
      presence_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      presence_respect_remark: [''],

      // Respect des instructions LL
      ll_instruction_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      ll_instruction_respect_remark: [''],

      // Gestion du temps
      time_management_respect_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      time_management_respect_remark: [''],

      // Mémoire
      memory_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      memory_remark: [''],

      // Logique
      logic_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      logic_remark: [''],

      // Motivation
      motivation_score: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      motivation_remark: [''],

      // Score général (calculé automatiquement)
      score: [0]
    });

    // Calculer le score général en temps réel
    this.calculateGeneralScore();

    // Optionnel : Supprimer l'ID du candidat du localStorage après utilisation
    // Commenté pour permettre la réutilisation
    // if (candidateId) {
    //   localStorage.removeItem('selectedCandidateId');
    // }
  }

  /**
   * Calcul du score général en temps réel.
   */
  calculateGeneralScore(): void {
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

    // Function to calculate and update the total score
    const updateTotalScore = () => {
      const totalScore = scoreControls.reduce((sum, name) => {
        const value = this.ojtForm.get(name)?.value;
        
        // Convertir la valeur en nombre et ignorer les valeurs invalides
        const numericValue = Number(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue > 5) {
          return sum; // Ne pas inclure cette valeur dans le calcul
        }
        
        return sum + numericValue;
      }, 0);
      
      // Mettre à jour le champ "score" avec la somme calculée
      this.ojtForm.get('score')?.setValue(totalScore, { emitEvent: false });
    };

    // Calculate initial score
    updateTotalScore();
    
    // Subscribe to changes in score controls to update total score
    scoreControls.forEach(controlName => {
      this.ojtForm.get(controlName)?.valueChanges.subscribe(() => {
        updateTotalScore();
      });
    });
  }

  /**
   * Soumission du formulaire.
   */
  onSubmit(): void {
    console.group('[Soumission du Formulaire]');
    console.log('État actuel du formulaire:', this.ojtForm);

    // Marquer tous les champs comme touched pour afficher les erreurs
    this.markFormGroupTouched(this.ojtForm);

    // Vérifier si le formulaire est valide
    if (this.ojtForm.valid) {
      const formData = this.ojtForm.value;
      
      // Convertir les scores en nombres
      const processedData = this.processFormData(formData);
      console.log('Données du formulaire préparées pour envoi:', processedData);

      // Appel de l'API Flask avec HttpClient
this.http.post(`${this.apiUrl}/eval/trainer/ojt/evaluations`, processedData).subscribe({        next: (response) => {
          console.log('Réponse du serveur:', response);
          alert('Évaluation enregistrée avec succès!');
          this.resetForm();
        },
        error: (error) => {
          console.error('Erreur lors de la soumission:', error);
          let errorMessage = 'Erreur lors de l\'enregistrement de l\'évaluation';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            errorMessage = error.error.errors.join(', ');
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          alert(`Erreur: ${errorMessage}`);
        }
      });
    } else {
      // Afficher les erreurs de validation
      console.error('Le formulaire est invalide.');
      console.error('Erreurs de validation:', this.getFormErrors(this.ojtForm));
      alert('Veuillez remplir tous les champs obligatoires correctement.');
    }

    console.groupEnd();
  }

  /**
   * Traite les données du formulaire avant envoi
   */
  private processFormData(formData: any): any {
    const processed = { ...formData };
    
    // Convertir les scores en nombres
    const scoreFields = [
      'speed_score', 'quality_score', 'ehs_rules_respect_score',
      'presence_respect_score', 'll_instruction_respect_score',
      'time_management_respect_score', 'memory_score', 'logic_score',
      'motivation_score', 'score'
    ];
    
    scoreFields.forEach(field => {
      if (processed[field] !== null && processed[field] !== undefined) {
        processed[field] = Number(processed[field]);
      }
    });
    
    return processed;
  }

  /**
   * Marque tous les champs du formulaire comme touched
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
   * Remet à zéro le formulaire
   */
  private resetForm(): void {
    // Garder les IDs du formateur et du candidat
    const trainerId = this.ojtForm.get('id_trainer')?.value;
    const candidateId = this.ojtForm.get('id_candidate')?.value;
    
    this.ojtForm.reset();
    
    // Remettre les IDs
    this.ojtForm.patchValue({
      id_trainer: trainerId,
      id_candidate: candidateId,
      score: 0
    });
  }

  /**
   * Récupère les erreurs de validation du formulaire.
   * @param formGroup Le groupe de formulaires à inspecter.
   * @returns Un objet contenant les erreurs pour chaque champ.
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
   * Récupère l'ID du formateur connecté depuis le localStorage.
   */
  private getTrainerId(): string | null {
    return localStorage.getItem('trainerId'); // Ou sessionStorage selon votre implémentation
  }

  /**
   * Basculer l'affichage des scores.
   */
  toggleScores(): void {
    this.showScores = !this.showScores;
  }

  /**
   * Vérifie si un champ a une erreur et a été touché
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.ojtForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Récupère le message d'erreur pour un champ donné
   */
  getFieldErrorMessage(fieldName: string): string {
    const field = this.ojtForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} est requis.`;
      }
      if (field.errors['min']) {
        return `${this.getFieldDisplayName(fieldName)} doit être au minimum ${field.errors['min'].min}.`;
      }
      if (field.errors['max']) {
        return `${this.getFieldDisplayName(fieldName)} doit être au maximum ${field.errors['max'].max}.`;
      }
    }
    return '';
  }

  /**
   * Récupère le nom d'affichage convivial pour un champ
   */
  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'speed_score': 'Score de vitesse',
      'quality_score': 'Score de qualité',
      'ehs_rules_respect_score': 'Score de respect des règles EHS',
      'presence_respect_score': 'Score de respect de présence',
      'll_instruction_respect_score': 'Score de respect des instructions LL',
      'time_management_respect_score': 'Score de gestion du temps',
      'memory_score': 'Score de mémoire',
      'logic_score': 'Score de logique',
      'motivation_score': 'Score de motivation',
      'id_trainer': 'ID du formateur',
      'id_candidate': 'ID du candidat'
    };
    
    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Récupère le score total maximum possible
   */
  getMaxScore(): number {
    return this.scoreOptions.length * 9; // 9 critères × score max (5)
  }

  /**
   * Calcule le pourcentage du score actuel
   */
  getScorePercentage(): number {
    const currentScore = this.ojtForm.get('score')?.value || 0;
    const maxScore = this.getMaxScore();
    return Math.round((currentScore / maxScore) * 100);
  }
}