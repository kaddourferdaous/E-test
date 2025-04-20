import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  reply?: string;
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
[x: string]: any;
  contactForm!: FormGroup;
  api = "http://localhost:5000/contact";
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
    const apiUrl = `${this.api}/add_contact`;
    return this.http.post(apiUrl, contactData);
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log('[SUBMIT] Envoi des données:', formData);
  
      this.sendContactData(formData).subscribe({
        next: (response) => {
          console.log('[SUBMIT] Réponse du backend:', response);
  
          // Si la réponse contient directement un _id
          if (response && response.id) {
            console.log('[SUBMIT] id reçu :', response._id);
            localStorage.setItem('submittedContactId', response.id); // Enregistrement de l'_id
            this.showForm = false;
            this.fetchSubmittedContactById(response.id); // Recherche du contact par ID
          } else {
            console.warn('[SUBMIT] _id manquant dans la réponse. Réponse:', response);
            alert('Erreur : Aucun identifiant n’a été renvoyé.');
          }
        },
        error: (error) => {
          console.error('[SUBMIT] Erreur d’envoi:', error);
          alert('Erreur lors de l’envoi du message.');
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
    alert(`Vous avez réagi avec : ${reaction}`);  // Optionnel : Afficher une alerte ou un message
  }

  fetchSubmittedContactById(id: string): void {
    console.log('[FETCH] Recherche du message par ID:', id);
    this.http.get<Contact>(`${this.api}/get_contact/${id}`).subscribe({
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
        alert('Impossible de récupérer le message.');
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
          return this.http.get<Contact>(`${this.api}/get_contact/${id}`);
        })
      )
      .subscribe((contact) => {
        if (contact.reply) {
          console.log('[POLLING] Réponse trouvée :', contact.reply);
          this.submittedContact = contact;
          this.pollingSubscription?.unsubscribe();
        } else {
          console.log('[POLLING] Toujours aucune réponse.');
        }
      });
  }

  resetForm(): void {
    console.log('[RESET] Réinitialisation du formulaire.');
    this.contactForm.reset();
    this.showForm = true;
    this.showResponse = false;
    this.submittedContact = null;
    localStorage.removeItem('submittedContactId');
    this.pollingSubscription?.unsubscribe();
  }

  logout() {
    // Si tu ajoutes un login, tu pourras gérer ici
  }}