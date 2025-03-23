import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialisation du formulaire
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {}

  /**
   * Soumission du formulaire de connexion
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement.';
      return;
    }
  
    const { email, password } = this.loginForm.value;
  
    this.authService.login(email, password).subscribe(
      (response) => {
        console.log('Connexion réussie :', response);
  
        // Supposons que la réponse contient un objet utilisateur avec des informations
        const candidateInfo = {
          id: response.id,
          name: response.name,
          email: response.email
        };
  
        // Sauvegarder ces informations dans localStorage ou sessionStorage
        localStorage.setItem('candidateInfo', JSON.stringify(candidateInfo));
        localStorage.setItem('authToken', response.token); // Sauvegarder le token si nécessaire
  
        this.router.navigate(['/home']); // Rediriger vers la page home
      },
      (error) => {
        console.error('Erreur lors de la connexion :', error);
        this.errorMessage = 'Échec de la connexion. Veuillez vérifier vos identifiants.';
      }
    );
  }
  
}