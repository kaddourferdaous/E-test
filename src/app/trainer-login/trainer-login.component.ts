import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trainer-login',
  templateUrl: './trainer-login.component.html',
  styleUrls: ['./trainer-login.component.css']
})
export class TrainerLoginComponent implements OnInit {
  loginForm: FormGroup;
  twoFAForm: FormGroup;
  errorMessage: string = '';
  isLoading = false;
  
  // États du flux d'authentification
  showLogin = true;           // Page d'authentification initiale
  showTwoFA = false;         // Page QR code et vérification 2FA
  show2FASetup = false;      // Configuration initiale 2FA
  showBackupCodes = false;   // Affichage des codes de récupération
  
  trainerData: any = null;
  qrCodeUrl: string = '';
  setupSecretKey: string = '';
  backupCodes: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      matricule: ['', Validators.required],
    });

    this.twoFAForm = this.fb.group({
      totpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit() {
    console.group('[TrainerLogin] Session formateur');
    this.authService.printTrainerSessionInfo();
    console.groupEnd();

    // Réinitialiser l'état - toujours commencer par la page de connexion
    this.resetToLogin();
    
    // Nettoyer les données en attente au démarrage
    localStorage.removeItem('pendingTrainer');
  }

  // Méthode pour réinitialiser à la page de connexion
  resetToLogin() {
    this.showLogin = true;
    this.showTwoFA = false;
    this.show2FASetup = false;
    this.showBackupCodes = false;
    this.trainerData = null;
    this.qrCodeUrl = '';
    this.setupSecretKey = '';
    this.backupCodes = [];
    this.errorMessage = '';
    this.loginForm.reset();
    this.twoFAForm.reset();
  }

  onSubmit() {
    console.log('onSubmit called', { formValid: this.loginForm.valid, formValue: this.loginForm.value });

    if (this.loginForm.invalid) {
      console.log('Form is invalid');
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      matricule: this.loginForm.get('matricule')?.value,
      role: 'trainer'
    };

    console.log('Credentials envoyées:', credentials);

    this.authService.loginTrainer(credentials).subscribe({
      next: (response) => {
        console.log('Réponse de l\'API :', response);
        this.isLoading = false;
        
        if (response.requires_2fa) {
          // 2FA requise - passer à la page QR code
          this.trainerData = response;
          localStorage.setItem('pendingTrainer', JSON.stringify(response));
          
          // Transition vers la page QR code
          this.showLogin = false;
          this.showTwoFA = true;
          
          console.log('2FA requise pour:', response.matricule);
          
          // Générer le QR code si le secret temporaire existe
          if (response.totp_secret_temp) {
            this.generateQRCode(response.totp_secret_temp, response.email);
          } else {
            console.error('Pas de totp_secret_temp dans la réponse');
    
          }
        } else if (response.id) {
          // Connexion réussie sans 2FA - redirection directe
          console.log('Connexion réussie sans 2FA');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Matricule invalide';
        }
      },
      error: (err) => {
        console.error('Erreur lors de la connexion:', err);
        this.isLoading = false;
        this.errorMessage = err.status === 401 || err.status === 400
          ? 'Matricule invalide'
          : 'Une erreur s\'est produite lors de la connexion';
      }
    });
  }

  // Méthode pour générer le QR code
  generateQRCode(secret: string, email: string) {
    const appName = 'HR App';
    const qrUrl = `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${appName}`;
    
    console.log('Génération QR Code avec URL:', qrUrl);
    
    // Utiliser un service en ligne pour générer le QR code
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
    this.qrCodeUrl = qrApiUrl;
    
    console.log('QR Code URL généré:', this.qrCodeUrl);
  }

  onTwoFASubmit() {
    if (this.twoFAForm.invalid || !this.trainerData) {
      Object.keys(this.twoFAForm.controls).forEach(key => {
        this.twoFAForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const totpCode = this.twoFAForm.get('totpCode')?.value;

    const requestBody = {
      totp_code: totpCode,
      trainer_id: this.trainerData.trainer_id,
      is_login: true
    };

    console.log('Body 2FA envoyé:', requestBody);

    // Vérifier le code 2FA pour la connexion
    this.authService.verify2FA(this.trainerData.matricule, requestBody).subscribe({
      next: (response) => {
        console.log('Vérification 2FA réussie:', response);
        this.isLoading = false;
        
        if (response.success && response.data) {
          // Stocker les informations du formateur connecté
          localStorage.setItem('trainer', JSON.stringify(response.data));
          localStorage.setItem('trainerId', response.data.id.toString());
          localStorage.setItem('trainerToken', response.data.token);
          localStorage.removeItem('pendingTrainer');
          
          this.authService.isAuthenticated = true;
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Code invalide';
        }
      },
      error: (err) => {
        console.error('Erreur lors de la vérification 2FA:', err);
        this.isLoading = false;
        
        if (err.status === 429) {
          this.errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
        } else {
          this.errorMessage = err.error?.message || 'Code invalide';
        }
        
        // Réinitialiser le formulaire
        this.twoFAForm.patchValue({ totpCode: '' });
      }
    });
  }

  setup2FA() {
    if (!this.trainerData) {
      this.errorMessage = 'Aucun formateur en attente';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.setupTotp(this.trainerData.matricule).subscribe({
      next: (response) => {
        console.log('Setup 2FA response:', response);
        this.isLoading = false;
        
        if (response.success && response.data) {
          this.qrCodeUrl = response.data.qr_code;
          this.setupSecretKey = response.data.secret_key;
          this.show2FASetup = true;
          this.showTwoFA = false;
        } else {
          this.errorMessage = 'Erreur lors de la configuration 2FA';
        }
      },
      error: (err) => {
        console.error('Erreur setup 2FA:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la configuration 2FA';
      }
    });
  }

  verify2FASetup() {
    if (this.twoFAForm.invalid || !this.trainerData || !this.setupSecretKey) {
      Object.keys(this.twoFAForm.controls).forEach(key => {
        this.twoFAForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const totpCode = this.twoFAForm.get('totpCode')?.value;

    const requestBody = {
      totp_code: totpCode,
      secret_key: this.setupSecretKey,
      is_login: false
    };

    // Vérifier et activer la 2FA
    this.authService.verify2FA(this.trainerData.matricule, requestBody).subscribe({
      next: (response) => {
        console.log('Activation 2FA réussie:', response);
        this.isLoading = false;
        
        if (response.success && response.data) {
          this.backupCodes = response.data.backup_codes || [];
          this.showBackupCodes = true;
          this.show2FASetup = false;
        } else {
          this.errorMessage = 'Code invalide';
        }
      },
      error: (err) => {
        console.error('Erreur activation 2FA:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Code invalide';
        this.twoFAForm.patchValue({ totpCode: '' });
      }
    });
  }

  finishSetup() {
    // Rediriger vers la page de connexion pour se connecter avec la 2FA activée
    this.resetToLogin();
  }

  cancelSetup() {
    this.show2FASetup = false;
    this.showTwoFA = true;
    this.qrCodeUrl = '';
    this.setupSecretKey = '';
    this.twoFAForm.patchValue({ totpCode: '' });
    this.errorMessage = '';
  }

  cancel2FA() {
    // Retourner à la page de connexion
    this.resetToLogin();
    localStorage.removeItem('pendingTrainer');
  }

  // Méthode pour retourner à la page de connexion depuis n'importe quel état
  backToLogin() {
    this.resetToLogin();
    localStorage.removeItem('pendingTrainer');
  }

  get2FAStatus() {
    if (!this.trainerData) return;

    this.authService.get2faStatus(this.trainerData.matricule).subscribe({
      next: (response) => {
        console.log('Statut 2FA:', response);
        if (response.success && !response.data.is_2fa_enabled) {
          console.log('2FA non configurée, proposition de setup');
        }
      },
      error: (err) => {
        console.error('Erreur récupération statut 2FA:', err);
      }
    });
  }

  printBackupCodes() {
    if (this.backupCodes.length > 0) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Codes de récupération 2FA</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .code { 
                  background: #f5f5f5; 
                  padding: 5px; 
                  margin: 5px 0; 
                  font-family: monospace; 
                  font-size: 14px;
                  border: 1px solid #ddd;
                }
                .warning {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  padding: 10px;
                  margin: 10px 0;
                  border-radius: 4px;
                }
              </style>
            </head>
            <body>
              <h2>Codes de récupération 2FA</h2>
              <div class="warning">
                <strong>Important:</strong> Conservez ces codes en lieu sûr. 
                Chaque code ne peut être utilisé qu'une seule fois.
              </div>
              ${this.backupCodes.map(code => `<div class="code">${code}</div>`).join('')}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  downloadBackupCodes() {
    if (this.backupCodes.length > 0) {
      const content = `Codes de récupération 2FA - HR App\n\n` +
        `IMPORTANT: Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.\n\n` +
        this.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');
        
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-codes-${this.trainerData?.matricule || 'trainer'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }
}