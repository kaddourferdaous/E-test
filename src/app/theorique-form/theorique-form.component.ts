import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateService } from '../candidate.service';

@Component({
  selector: 'app-theorique-form',
  templateUrl: './theorique-form.component.html',
  styleUrls: ['./theorique-form.component.css']
})
export class TheoriqueFormComponent implements OnInit {
  theorieForm!: FormGroup;
  trainerId!: string | null;
  scoreOptions = [1, 2, 3, 4, 5]; 
  constructor(private fb: FormBuilder, private http: HttpClient,private candidateService:CandidateService) {}
  ngOnInit(): void {
    // Get trainer ID
    this.trainerId = this.getTrainerId();
    if (!this.trainerId) {
      console.error('Erreur : ID du formateur non disponible.');
      alert('Erreur : Impossible de récupérer l\'ID du formateur.');
      return;
    }
    
    // Get candidate ID
    const candidateId = localStorage.getItem('selectedCandidateId');
    if (candidateId) {
      console.log('Retrieved candidateId from localStorage:', candidateId);
    }
    
    // Initialize form
    this.theorieForm = this.fb.group({
      id_trainer: [this.trainerId, Validators.required],
      id_candidate: [candidateId || '', Validators.required],
      
      // Speed
      speed_score: ['', Validators.required],
      speed_remark: [''],
      
      // Quality
      quality_score: ['', Validators.required],
      quality_remark: [''],
      
      // EHS Rules Respect
      ehs_rules_respect_score: ['', Validators.required],
      ehs_rules_respect_remark: [''],
      
      // Presence Respect
      presence_respect_score: ['', Validators.required],
      presence_respect_remark: [''],
      
      // LL Instruction Respect
      ll_instruction_respect_score: ['', Validators.required],
      ll_instruction_respect_remark: [''],
      
      // Time Management Respect
      time_management_respect_score: ['', Validators.required],
      time_management_respect_remark: [''],
      
      // Memory
      memory_score: ['', Validators.required],
      memory_remark: [''],
      
      // Logic
      logic_score: ['', Validators.required],
      logic_remark: [''],
      
      // Motivation
      motivation_score: ['', Validators.required],
      motivation_remark: [''],
      
      // General Score
      score: ['', Validators.required]
    });
    this.calculateGeneralScore();
    // Optional: Clear the localStorage after retrieving the ID
    // to prevent it from being reused unintentionally on page refresh
    if (candidateId) {
      localStorage.removeItem('selectedCandidateId');
    }
  }

  /**
   * Ouvre le modal pour ajouter une évaluation et définit l'ID du candidat sélectionné.
   * @param candidateId ID du candidat sélectionné.
   */
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
        const value = this.theorieForm.get(name)?.value;
        
        // Convertir la valeur en nombre et ignorer les valeurs invalides
        const numericValue = Number(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue > 5) {
          return sum; // Ne pas inclure cette valeur dans le calcul
        }
        
        return sum + numericValue;
      }, 0);
      
      // Mettre à jour le champ "score" avec la somme calculée
      this.theorieForm.get('score')?.setValue(totalScore, { emitEvent: false });
    };
  
    // Calculate initial score
    updateTotalScore();
    
    // Subscribe to changes in score controls to update total score
    scoreControls.forEach(controlName => {
      this.theorieForm.get(controlName)?.valueChanges.subscribe(() => {
        updateTotalScore();
      });
    });
  }

  onSubmit(): void {
    console.group('[Soumission du Formulaire]');
    console.log('État actuel du formulaire:', this.theorieForm);
  
    // Activer le champ "score" pour qu'il soit inclus dans les données
    this.theorieForm.get('score')?.enable();
  
    // Vérifier si le formulaire est valide
    if (this.theorieForm.valid) {
      const formData = this.theorieForm.value;
      console.log('Données du formulaire préparées pour envoi:', formData);
  
      // Appel de l'API Flask avec HttpClient
      this.http.post('http://localhost:5000/eval/trainer/theorique/evaluations', formData).subscribe({
        next: (response) => {
          console.log('Réponse du serveur:', response);
          alert('Évaluation enregistrée avec succès!');
  
          // Save the IDs before resetting the form
          const trainerId = this.theorieForm.get('id_trainer')?.value;
          const candidateId = this.theorieForm.get('id_candidate')?.value;
  
          // Réinitialiser le formulaire après soumission
          this.theorieForm.reset();
  
          // Restore the IDs after form reset
          this.theorieForm.patchValue({
            id_trainer: trainerId,
            id_candidate: candidateId
          });
  
          // Make sure candidateId remains in localStorage
          if (candidateId) {
            localStorage.setItem('selectedCandidateId', candidateId);
          }
  
          // Désactiver à nouveau le champ "score" après soumission
          this.theorieForm.get('score')?.disable();
        },
        error: (error) => {
          console.error('Erreur lors de la soumission:', error);
          alert(`Erreur: ${error.error?.message || error.message}`);
        }
      });
    } else {
      // Afficher les erreurs de validation
      console.error('Le formulaire est invalide.');
      console.error('Erreurs de validation:', this.getFormErrors(this.theorieForm));
      alert('Veuillez remplir tous les champs obligatoires.');
    }
  
    // Désactiver à nouveau le champ "score" si la soumission échoue
    this.theorieForm.get('score')?.disable();
    console.groupEnd();
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
}