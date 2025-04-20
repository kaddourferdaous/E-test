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
  constructor(private fb: FormBuilder, private http: HttpClient, private candidateService: CandidateService) {}

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
    }

    // Initialiser le formulaire avec des valeurs par défaut pour éviter les valeurs `null`
    this.ojtForm = this.fb.group({
      id_trainer: [this.trainerId, Validators.required],
      id_candidate: [candidateId || '', Validators.required],

      // Vitesse
      speed_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      speed_remark: [''],

      // Qualité
      quality_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      quality_remark: [''],

      // Respect des règles EHS
      ehs_rules_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      ehs_rules_respect_remark: [''],

      // Respect de la présence
      presence_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      presence_respect_remark: [''],

      // Respect des instructions LL
      ll_instruction_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      ll_instruction_respect_remark: [''],

      // Gestion du temps
      time_management_respect_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      time_management_respect_remark: [''],

      // Mémoire
      memory_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      memory_remark: [''],

      // Logique
      logic_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      logic_remark: [''],

      // Motivation
      motivation_score: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      motivation_remark: [''],

      // Score général (désactivé par défaut)
      score: [{ value: 0, disabled: true }, Validators.required]
    });

    // Calculer le score général en temps réel
    this.calculateGeneralScore();

    // Optionnel : Supprimer l'ID du candidat du localStorage après utilisation
    if (candidateId) {
      localStorage.removeItem('selectedCandidateId');
    }
  }

  /**
   * Calcul du score général en temps réel.
   */
 /**
 * Calcul du score général en temps réel.
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

    // Activer le champ "score" pour qu'il soit inclus dans les données
    this.ojtForm.get('score')?.enable();

    // Vérifier si le formulaire est valide
    if (this.ojtForm.valid) {
      const formData = this.ojtForm.value;
      console.log('Données du formulaire préparées pour envoi:', formData);

      // Appel de l'API Flask avec HttpClient
      this.http.post('http://localhost:5000/eval/trainer/ojt/evaluations', formData).subscribe({
        next: (response) => {
          console.log('Réponse du serveur:', response);
          alert('Évaluation enregistrée avec succès!');
          this.ojtForm.reset();
        },
        error: (error) => {
          console.error('Erreur lors de la soumission:', error);
          alert(`Erreur: ${error.error?.message || error.message}`);
        }
      });
    } else {
      // Afficher les erreurs de validation
      console.error('Le formulaire est invalide.');
      console.error('Erreurs de validation:', this.getFormErrors(this.ojtForm));
      alert('Veuillez remplir tous les champs obligatoires.');
    }

    // Désactiver à nouveau le champ "score" après soumission
    this.ojtForm.get('score')?.disable();
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

  /**
   * Basculer l'affichage des scores.
   */
  toggleScores() {
    this.showScores = !this.showScores;
  }
}