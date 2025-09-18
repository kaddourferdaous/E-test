import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface Contact {
  id: number; // Changé de _id à id pour correspondre au backend
  name: string;
  email: string;
  subject: string;
  message: string;
  reply?: string;
  created_at?: string;
  updated_at?: string;
  replied_at?: string;
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  [x: string]: any;
  contactForm!: FormGroup;
  private apiUrl = 'https://training-backend-1pda.onrender.com';
  showForm = true;
  showResponse = false;
  submittedContact: Contact | null = null;
  pollingSubscription: Subscription | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });

    // Recharger l'état si l'utilisateur a déjà envoyé un message
    const contactId = localStorage.getItem('submittedContactId');
    if (contactId) {
      console.log('[INIT] ID trouvé en localStorage :', contactId);
      this.fetchSubmittedContactById(contactId);
    }
  }

  sendContactData(contactData: any): Observable<any> {
    // ✅ Ajout du préfixe /contact
    const apiUrl = `${this.apiUrl}/contact/add_contact`;
    console.log('[SEND] URL utilisée :', apiUrl);
    return this.http.post(apiUrl, contactData);
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log('[SUBMIT] Envoi des données:', formData);
  
      this.sendContactData(formData).subscribe({
        next: (response) => {
          console.log('[SUBMIT] Réponse du backend:', response);
  
          // ✅ Correction : utiliser response.id au lieu de response._id
          if (response && response.id) {
            console.log('[SUBMIT] ID reçu :', response.id);
            localStorage.setItem('submittedContactId', response.id.toString()); // Conversion en string
            this.showForm = false;
            this.fetchSubmittedContactById(response.id.toString()); // Recherche du contact par ID
          } else {
            console.warn('[SUBMIT] ID manquant dans la réponse. Réponse:', response);
            alert('Erreur : Aucun identifiant na été renvoyé.');
          }
        },
        error: (error) => {
          console.error('[SUBMIT] Erreur denvoi:', error);
          
          // ✅ Messages d'erreur plus détaillés
          if (error.status === 0) {
            alert('Erreur de connexion au serveur. Vérifiez votre connexion.');
          } else if (error.status === 400) {
            alert('Données invalides. Vérifiez vos informations.');
          } else if (error.status === 500) {
            alert('Erreur du serveur. Réessayez plus tard.');
          } else {
            alert(`Erreur lors de l'envoi du message. Code: ${error.status}`);
          }
        }
      });
    } else {
      alert('Veuillez remplir correctement tous les champs.');
    }
  }

  userReaction: string | null = null;

  reactToResponse(reaction: string): void {
    this.userReaction = reaction;
    console.log('Utilisateur a réagi avec :', reaction);
    alert(`Vous avez réagi avec : ${reaction}`);
  }

  fetchSubmittedContactById(id: string): void {
    // ✅ Ajout du préfixe /contact
    const fetchUrl = `${this.apiUrl}/contact/get_contact/${id}`;
    console.log('[FETCH] URL utilisée :', fetchUrl);
    console.log('[FETCH] Recherche du message par ID:', id);
    
    this.http.get<Contact>(fetchUrl).subscribe({
      next: (contact) => {
        console.log('[FETCH] Données récupérées :', contact);
        this.submittedContact = contact;
        this.showForm = false;
        this.showResponse = true;

        if (!contact.reply) {
          console.log('[FETCH] Pas encore de réponse, démarrage du polling...');
          this.startPolling(id);
        } else {
          console.log('[FETCH] Réponse déjà disponible :', contact.reply);
        }
      },
      error: (error) => {
        console.error('[FETCH] Erreur récupération message par ID:', error);
        
        // ✅ Messages d'erreur plus détaillés
        if (error.status === 404) {
          alert('Message non trouvé. Il a peut-être été supprimé.');
          this.resetForm(); // Nettoyer si le message n'existe plus
        } else if (error.status === 0) {
          alert('Erreur de connexion au serveur.');
        } else {
          alert(`Impossible de récupérer le message. Code: ${error.status}`);
        }
      }
    });
  }

  startPolling(id: string): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    this.pollingSubscription = interval(5000) // toutes les 5 secondes
      .pipe(
        switchMap(() => {
          console.log('[POLLING] Vérification de la réponse...');
          // ✅ Ajout du préfixe /contact
          return this.http.get<Contact>(`${this.apiUrl}/contact/get_contact/${id}`);
        })
      )
      .subscribe({
        next: (contact) => {
          if (contact.reply) {
            console.log('[POLLING] Réponse trouvée :', contact.reply);
            this.submittedContact = contact;
            this.pollingSubscription?.unsubscribe();
          } else {
            console.log('[POLLING] Toujours aucune réponse.');
          }
        },
        error: (error) => {
          console.error('[POLLING] Erreur pendant le polling:', error);
          // Arrêter le polling en cas d'erreur persistante
          if (error.status === 404) {
            console.log('[POLLING] Message supprimé, arrêt du polling');
            this.pollingSubscription?.unsubscribe();
            this.resetForm();
          }
        }
      });
  }

  resetForm(): void {
    console.log('[RESET] Réinitialisation du formulaire.');
    this.contactForm.reset();
    this.showForm = true;
    this.showResponse = false;
    this.submittedContact = null;
    this.userReaction = null; // ✅ Reset de la réaction aussi
    localStorage.removeItem('submittedContactId');
    this.pollingSubscription?.unsubscribe();
  }

  // ✅ Méthode pour tester la connexion
  testConnection(): void {
    const testUrl = `${this.apiUrl}/contact/test`;
    console.log('[TEST] Test de connexion :', testUrl);
    
    this.http.get(testUrl).subscribe({
      next: (response) => {
        console.log('[TEST] Connexion OK :', response);
        alert('Connexion au serveur OK !');
      },
      error: (error) => {
        console.error('[TEST] Erreur de connexion :', error);
        alert('Erreur de connexion au serveur !');
      }
    });
  }

  logout() {
    // Si tu ajoutes un login, tu pourras gérer ici
    this.resetForm();
  }

  // ✅ Méthode pour nettoyer les ressources
  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
}