import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trainer-login',
  templateUrl: './trainer-login.component.html',
  styleUrls: ['./trainer-login.component.css']
})
export class TrainerLoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      matricule: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['trainer', Validators.required]
    });
  }
  ngOnInit() {
    console.group('[Dashboard] Session formateur');
    this.authService.printTrainerSessionInfo();
    console.groupEnd();
  }
// In your trainer-login.component.ts

onSubmit() {
  if (this.loginForm.invalid) return;

  // Extraire les données du formulaire
  const { role, ...credentials } = this.loginForm.value;

  // Utiliser uniquement la méthode pour "trainer"
  this.authService.loginTrainer(credentials).subscribe({
    next: (response) => {
      console.log('Réponse de l\'API :', response); // Log de la réponse pour déboguer

      // Vérifier si la réponse contient une indication de succès
      if (response && response.id) {
        // Connexion réussie
        console.log('Connexion réussie');
        this.router.navigate(['/dashboard']);
      } else {
        // Si pas de succès, afficher un message d'erreur
        this.errorMessage = 'Identifiants invalides';
      }
    },
    error: (err) => {
      console.error('Erreur lors de la connexion:', err); // Log de l'erreur pour déboguer

      // Gérer l'erreur HTTP
      if (err.status === 401 || err.status === 400) {
        this.errorMessage = 'Identifiants invalides';
      } else {
        this.errorMessage = 'Une erreur s\'est produite lors de la connexion';
      }
    }
  });
}

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
}