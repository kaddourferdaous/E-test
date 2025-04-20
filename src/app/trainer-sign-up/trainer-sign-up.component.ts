import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Assurez-vous que le service est correctement importé

@Component({
  selector: 'app-trainer-sign-up',
  templateUrl: './trainer-sign-up.component.html',
  styleUrls: ['./trainer-sign-up.component.css']
})
export class TrainerSignUpComponent implements OnInit {
  // Déclaration du formulaire
  trainerSignUpForm!: FormGroup;

  // Messages d'erreur et de succès
  errorMessage: string = '';
  successMessage: string = '';
  passwordVisible = false;

  /** Méthode pour afficher/masquer le mot de passe */
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  
  constructor(
    private fb: FormBuilder, // FormBuilder pour créer le formulaire réactif
    private authService: AuthService, // Service pour l'authentification
    private router: Router // Router pour la navigation
  ) {}

  // Méthode ngOnInit() pour l'initialisation
  ngOnInit(): void {
    // Initialisation du formulaire
    this.trainerSignUpForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.minLength(5)]], // Matricule avec validation
      password: ['', [Validators.required, Validators.minLength(6)]], // Mot de passe avec validation
      nom: ['', [Validators.required]], // Nom avec validation
      email: ['', [Validators.required, Validators.email]], // Email avec validation
    });

    document.body.classList.add('signup-page');


 
  }

 

  // Méthode appelée lors de la soumission du formulaire
  onSubmit(): void {
    console.log('Form submitted!'); // Log pour vérifier que la méthode est appelée

    // Vérifier si le formulaire est valide
    if (this.trainerSignUpForm.invalid) {
      console.log('Form is invalid'); // Log pour débogage
      return;
    }

    // Récupérer les données du formulaire
    const trainerData = this.trainerSignUpForm.value;
    console.log('Form data:', trainerData); // Log pour débogage

    // Appeler le service pour créer un formateur
    this.authService.createTrainer(trainerData).subscribe(
      (response) => {
        console.log('Response from server:', response); // Log pour débogage
        this.successMessage = 'Trainer account successfully created !';
        this.errorMessage = '';

        // Redirection après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/trainerLogin']);
        }, 2000);
      },
      (error) => {
        console.error('Error creating trainer:', error); // Log pour débogage
        this.errorMessage = 'Erreur lors de la création du compte. Veuillez réessayer.';
        this.successMessage = '';
      }
    );
  }

  
  ngOnDestroy(): void {
    document.body.classList.remove('signup-page');
  }
  
}