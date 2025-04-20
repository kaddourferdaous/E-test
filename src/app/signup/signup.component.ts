import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
showPassword(arg0: string,$event: MouseEvent) {
throw new Error('Method not implemented.');
}
  signupForm: FormGroup;
  loading: boolean = false;
  errorMessage: string = '';  passwordVisible: boolean = false;  // Par défaut, le mot de passe est caché
  confirmPasswordVisible:boolean=false;

  constructor(private fb: FormBuilder, private authService :AuthService,private router:Router) {
    this.signupForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      agree: [false, Validators.requiredTrue]
    });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      return;
    }

    const formData = this.signupForm.value;

    if (formData.password !== formData.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas";
      return;
    }

    this.loading = true;
    this.authService.signup(formData).subscribe({
      next: (response) => {
        // Si l'inscription réussit
        console.log(response);
        alert('Inscription réussie!');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error.message || 'Une erreur est survenue';
      }
    });
  }
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  
  /** Méthode pour afficher/masquer le mot de passe de confirmation */
  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
  
}