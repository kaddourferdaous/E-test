import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-feedbacks',
  templateUrl: './feedbacks.component.html',
  styleUrls: ['./feedbacks.component.css']
})
export class FeedbacksComponent {
  contact = { name: '', email: '', subject: '', message: '' };
  contacts: any[] = [];  // Déclarer contacts comme un tableau vide au début

  constructor(private http: HttpClient) {}
  ngOnInit():void{
    this.getContacts();
  }

  // Méthode pour récupérer les contacts depuis l'API
  getContacts(): void {
    this.http.get<any[]>('http://localhost:5000/contact/get_contacts').subscribe(
      (data) => {
        this.contacts = data;  // Utilisez "contacts" pour stocker la liste des contacts
      },
      (error) => {
        console.error('Error fetching contacts:', error);
      }
    );
  }

  // Méthode pour effacer le formulaire après soumission
  clearForm(): void {
    this.contact = { name: '', email: '', subject: '', message: '' };
  }

  // Méthode pour activer/désactiver le champ de réponse
  toggleReplyInput(index: number): void {
    // Si "contacts" est défini, basculer la propriété isReplying pour activer/désactiver l'input
    if (this.contacts[index]) {
      this.contacts[index].isReplying = !this.contacts[index].isReplying;
    }
  }

  // Méthode pour envoyer la réponse
  sendReply(index: number): void {
    const contactId = this.contacts[index]._id;
    const replyMessage = this.contacts[index].reply;
  
    if (replyMessage.trim() !== '') {
      this.http.post(`http://localhost:5000/contact/reply/${contactId}`, { reply: replyMessage })
        .subscribe(
          (response) => {
            alert(`You replied to ${this.contacts[index].name}: ${replyMessage}`);
            this.contacts[index].isReplying = false;
            this.contacts[index].reply = '';
          },
          (error) => {
            console.error('Error replying:', error);
          }
        );
    }
  }
  
  // Méthode pour supprimer un message
  deleteMessage(index: number): void {
    const contactId = this.contacts[index]._id;
  
    this.http.delete(`http://localhost:5000/contact/delete_contact/${contactId}`)
      .subscribe(
        () => {
          alert('Message deleted');
          this.contacts.splice(index, 1);
        },
        (error) => {
          console.error('Error deleting message:', error);
        }
      );
  }
  userReaction: string | null = null;

  // Méthode pour gérer la réaction de l'utilisateur

}
