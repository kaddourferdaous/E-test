import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateService } from '../candidate.service';

@Component({
  selector: 'app-pratique-form',
  templateUrl: './pratique-form.component.html',
  styleUrls: ['./pratique-form.component.css']
})
export class PratiqueFormComponent implements OnInit {
  pratiqueForm!: FormGroup;
  trainerId!: string | null;
  candidateId!: string | null; // Ajout d'une propriété pour stocker l'ID candidat
  scores: any;
  showScores: boolean = false;
  scoreOptions: number[] = [1, 2, 3, 4, 5]; // Ajout des options de score

  constructor(private fb: FormBuilder, private http: HttpClient, private candidateService: CandidateService) {}
  
  ngOnInit(): void {
    // Get trainer ID
    this.trainerId = this.getTrainerId();
    if (!this.trainerId) {
      console.error('Erreur : ID du formateur non disponible.');
      alert('Erreur : Impossible de récupérer l\'ID du formateur.');
      return;
    }
    
    // Get candidate ID
    this.candidateId = localStorage.getItem('selectedCandidateId');
    if (this.candidateId) {
      console.log('Retrieved candidateId from localStorage:', this.candidateId);
    } else {
      console.error('Erreur : ID du candidat non disponible.');
      alert('Erreur : Impossible de récupérer l\'ID du candidat.');
      return;
    }
    
    // Initialize form
    this.pratiqueForm = this.fb.group({
      id_trainer: [this.trainerId, Validators.required],
      id_candidate: [this.candidateId, Validators.required], // Utilisation de this.candidateId
      
      // Speed
      speed_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      speed_remark: [''],
      
      // Quality
      quality_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      quality_remark: [''],
      
      // EHS Rules Respect
      ehs_rules_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      ehs_rules_respect_remark: [''],
      
      // Presence Respect
      presence_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      presence_respect_remark: [''],
      
      // LL Instruction Respect
      ll_instruction_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      ll_instruction_respect_remark: [''],
      
      // Time Management Respect
      time_management_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      time_management_respect_remark: [''],
      
      // Memory
      memory_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      memory_remark: [''],
      
      // Logic
      logic_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      logic_remark: [''],
      
      // Motivation
      motivation_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      motivation_remark: [''],
      
      // General Score
      score: [{ value: 0, disabled: true }, Validators.required] // Score désactivé car calculé automatiquement
    });
    
    this.calculateGeneralScore();
    
    // Ne PAS supprimer l'ID du localStorage ici
    // Ce code est commenté intentionnellement pour conserver l'ID
    // if (candidateId) {
    //   localStorage.removeItem('selectedCandidateId');
    // }
  }
  
  calculateGeneralScore() {
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
        const value = this.pratiqueForm.get(name)?.value;
        
        // Convertir la valeur en nombre et ignorer les valeurs invalides
        const numericValue = Number(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue > 5) {
          return sum; // Ne pas inclure cette valeur dans le calcul
        }
        
        return sum + numericValue;
      }, 0);
      
      // Mettre à jour le champ "score" avec la somme calculée
      this.pratiqueForm.get('score')?.setValue(totalScore, { emitEvent: false });
    };
  
    // Calculate initial score
    updateTotalScore();
    
    // Subscribe to changes in score controls to update total score
    scoreControls.forEach(controlName => {
      this.pratiqueForm.get(controlName)?.valueChanges.subscribe(() => {
        updateTotalScore();
      });
    });
  }

  /**
   * Vérification de l'ID candidat avant soumission
   */
  checkCandidateId(): boolean {
    if (!this.pratiqueForm.get('id_candidate')?.value) {
      // Si l'ID n'est pas dans le formulaire, essayer de le récupérer à nouveau
      const storedId = localStorage.getItem('selectedCandidateId');
      if (storedId) {
        this.candidateId = storedId;
        this.pratiqueForm.get('id_candidate')?.setValue(storedId);
        return true;
      }
      return false;
    }
    return true;
  }

  /**
   * Soumission du formulaire.
   */
  onSubmit(): void {
    // ...existing code...
    
    if (this.pratiqueForm.valid) {
      const formData = this.pratiqueForm.value;
      console.log('Données du formulaire préparées pour envoi:', formData);
  
      this.http.post('https://training-backend-1pda.onrender.com/eval/trainer/pratique/evaluations', formData).subscribe({
        next: (response) => {
          console.log('Réponse du serveur:', response);
          alert('Évaluation enregistrée avec succès!');
          this.pratiqueForm.reset();
          
          // REMOVE THIS LINE:
          // localStorage.removeItem('selectedCandidateId');
          
          // Reset the form but keep the IDs
          this.pratiqueForm.patchValue({
            id_trainer: this.trainerId,
            id_candidate: this.candidateId
          });
        },
        error: (error) => {
          console.error('Erreur lors de la soumission:', error);
          alert(`Erreur: ${error.error?.message || error.message}`);
        }
      });
    } else {
      // ...existing error handling...
    }
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
  
  toggleScores() {
    this.showScores = !this.showScores;
  }
}