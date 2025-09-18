import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-trainee-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
isLoading=false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
    });
  }

  ngOnInit(): void {}

onSubmit(): void {
  if (this.loginForm.invalid) {
    this.errorMessage = 'Veuillez saisir un ID valide (numérique).';
    return;
  }

  this.isLoading = true; // démarrage du loader
  this.errorMessage = '';

  const { id } = this.loginForm.value;

  this.authService.loginTraineeById(id).subscribe(
    (response) => {
      console.log('Full API response:', JSON.stringify(response, null, 2));

      if (!response || !response.id) {
        console.error('No id found in response. Response structure:', response);
        this.errorMessage = 'Erreur: ID du candidat non reçu du serveur.';
        this.isLoading = false;
        return;
      }

      const candidateInfo = {
        id: response.id,
        matricule: response.matricule || 'N/A',
        nom: response.nom || '',
        prenom: response.prenom || '',
        email: response.email || ''
      };

      localStorage.setItem('candidateId', candidateInfo.id.toString());
      localStorage.setItem('authToken', response.token || '');
      localStorage.setItem('candidateInfo', JSON.stringify(candidateInfo));

      this.authService.isAuthenticated = true;
      console.log('Informations sauvegardées:', candidateInfo);

      this.isLoading = false;
      this.router.navigate(['/home']);
    },
    (error) => {
      console.error('Erreur lors de la connexion stagiaire:', error);
      this.errorMessage = 'Échec de la connexion. Vérifiez votre Matricule';
      this.isLoading = false;
    }
  );
}

}