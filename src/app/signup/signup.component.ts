import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';


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
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService :AuthService) {
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
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error.message || 'Une erreur est survenue';
      }
    });
  }
}
