import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-feedbacks',
  templateUrl: './feedbacks.component.html',
  styleUrls: ['./feedbacks.component.css']
})
export class FeedbacksComponent implements OnInit {
isSidebarOpen: any;
toggleSidebar() {
throw new Error('Method not implemented.');
}
logout() {
throw new Error('Method not implemented.');
}
  // URL globale de l'API
  private apiUrl = 'https://training-backend-1pda.onrender.com';
  
  contact = { name: '', email: '', subject: '', message: '' };
  contacts: any[] = [];  // Déclarer contacts comme un tableau vide au début
  
  // Charts
  subjectChart: Chart | null = null;
  messageChart: Chart | null = null;
  dateChart: Chart | null = null;
  
  // For chart metrics
  subjectCounts: { [key: string]: number } = {};
  messageLengths: number[] = [];
  dateData: { date: string; count: number }[] = [];
  
  // ViewChild references for canvas elements
  @ViewChild('subjectChartCanvas') subjectChartCanvas!: ElementRef;
  @ViewChild('messageChartCanvas') messageChartCanvas!: ElementRef;
  @ViewChild('dateChartCanvas') dateChartCanvas!: ElementRef;

  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    this.getContacts();
  }
  
  ngAfterViewInit(): void {
    // We'll create charts after the view is initialized and data is loaded
  }

  // Méthode pour récupérer les contacts depuis l'API
  getContacts(): void {
    this.http.get<any>(`${this.apiUrl}/contact/get_contacts`).subscribe(
      (data) => {
        console.log('Data received from API:', data); // Debug log
        
        // Vérifier si data est un tableau ou un objet
        if (Array.isArray(data)) {
          this.contacts = data;
        } else if (data && typeof data === 'object') {
          // Si c'est un objet, vérifier s'il a une propriété qui contient le tableau
          if (data.contacts && Array.isArray(data.contacts)) {
            this.contacts = data.contacts;
          } else if (data.data && Array.isArray(data.data)) {
            this.contacts = data.data;
          } else {
            // Si c'est un objet avec les contacts directement
            this.contacts = Object.values(data);
          }
        } else {
          console.error('Unexpected data format:', data);
          this.contacts = [];
        }
        
        console.log('Processed contacts:', this.contacts); // Debug log
        this.processChartData();
        this.createCharts();
      },
      (error) => {
        console.error('Error fetching contacts:', error);
        this.contacts = []; // Assurer que contacts reste un tableau en cas d'erreur
      }
    );
  }

  // Process data for charts
  processChartData(): void {
    // Reset data
    this.subjectCounts = {};
    this.messageLengths = [];
    this.dateData = [];
    
    // Vérifier que contacts est bien un tableau avant de traiter
    if (!Array.isArray(this.contacts)) {
      console.error('Contacts is not an array:', this.contacts);
      return;
    }
    
    // Group feedback by date
    const dateCount: { [key: string]: number } = {};
    
    this.contacts.forEach(contact => {
      // Process subjects
      const subject = contact.subject || 'No Subject';
      this.subjectCounts[subject] = (this.subjectCounts[subject] || 0) + 1;
      
      // Process message lengths
      if (contact.message) {
        this.messageLengths.push(contact.message.length);
      }
      
      // Process dates
      if (contact.createdAt) {
        const date = new Date(contact.createdAt).toLocaleDateString();
        dateCount[date] = (dateCount[date] || 0) + 1;
      }
    });
    
    // Convert date data to sorted array
    this.dateData = Object.entries(dateCount)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Create charts
  createCharts(): void {
    setTimeout(() => {
      this.createSubjectChart();
      this.createMessageLengthChart();
      this.createDateChart();
    }, 100); // Small delay to ensure DOM is ready
  }
  
  // Create subject distribution chart
  createSubjectChart(): void {
    if (this.subjectChartCanvas && this.subjectChartCanvas.nativeElement) {
      const ctx = this.subjectChartCanvas.nativeElement.getContext('2d');
      
      // Destroy previous chart if it exists
      if (this.subjectChart) {
        this.subjectChart.destroy();
      }
      
      const labels = Object.keys(this.subjectCounts);
      const data = Object.values(this.subjectCounts);
      
      this.subjectChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Feedback Subjects',
            data: data,
            backgroundColor: this.generateColors(labels.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Distribution of Feedback Subjects'
            }
          }
        }
      });
    }
  }
  
  // Create message length chart
  createMessageLengthChart(): void {
    if (this.messageChartCanvas && this.messageChartCanvas.nativeElement) {
      const ctx = this.messageChartCanvas.nativeElement.getContext('2d');
      
      // Destroy previous chart if it exists
      if (this.messageChart) {
        this.messageChart.destroy();
      }
      
      // Create bins for message lengths
      const bins = [0, 50, 100, 200, 300, 500, 1000, 1500, 2000];
      const labels = bins.map((bin, index) => {
        if (index === bins.length - 1) return `${bin}+`;
        return `${bin}-${bins[index + 1]}`;
      });
      labels.pop(); // Remove the last empty range
      
      // Count messages in each bin
      const binCounts = Array(bins.length - 1).fill(0);
      
      this.messageLengths.forEach(length => {
        for (let i = 0; i < bins.length - 1; i++) {
          if (length >= bins[i] && length < bins[i + 1]) {
            binCounts[i]++;
            break;
          }
          if (i === bins.length - 2 && length >= bins[i + 1]) {
            binCounts[i]++;
          }
        }
      });
      
      this.messageChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Message Length Distribution',
            data: binCounts,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Messages'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Character Length'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Distribution of Message Lengths'
            }
          }
        }
      });
    }
  }
  
  // Create date chart
  createDateChart(): void {
    if (this.dateChartCanvas && this.dateChartCanvas.nativeElement) {
      const ctx = this.dateChartCanvas.nativeElement.getContext('2d');
      
      // Destroy previous chart if it exists
      if (this.dateChart) {
        this.dateChart.destroy();
      }
      
      this.dateChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.dateData.map(item => item.date),
          datasets: [{
            label: 'Feedback Count by Date',
            data: this.dateData.map(item => item.count),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Feedbacks'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Feedback Volume Over Time'
            }
          }
        }
      });
    }
  }
  
  // Generate random colors for charts
  generateColors(count: number): string[] {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137.5) % 360; // Use golden angle approximation for better distribution
      colors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    return colors;
  }
  
  // Method to refresh charts
  refreshCharts(): void {
    this.processChartData();
    this.createCharts();
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
    // Vérifications de sécurité
    if (index < 0 || index >= this.contacts.length) {
      console.error('Index invalide:', index);
      alert('Erreur: Contact non trouvé');
      return;
    }

    const contact = this.contacts[index];
    
    // Vérifier que le contact existe
    if (!contact) {
      console.error('Contact non trouvé à l\'index:', index);
      alert('Erreur: Contact non trouvé');
      return;
    }

    // Vérifier les différents formats possibles d'ID
    const contactId = contact._id || contact.id || contact.contactId;
    
    if (!contactId) {
      console.error('ID du contact manquant:', contact);
      alert('Erreur: ID du contact manquant');
      return;
    }

    const replyMessage = contact.reply;
    
    if (!replyMessage || replyMessage.trim() === '') {
      alert('Veuillez saisir un message de réponse');
      return;
    }

    console.log('Sending reply for contact ID:', contactId); // Debug log
    
    this.http.post(`${this.apiUrl}/contact/reply/${contactId}`, { reply: replyMessage.trim() })
      .subscribe(
        (response) => {
          console.log('Reply sent successfully:', response);
          alert(`You replied to ${contact.name || 'Unknown'}: ${replyMessage}`);
          contact.isReplying = false;
          contact.reply = '';
        },
        (error) => {
          console.error('Error replying:', error);
          if (error.status === 404) {
            alert('Erreur: Contact non trouvé dans la base de données');
          } else if (error.status === 400) {
            alert('Erreur: Données invalides');
          } else if (error.status === 500) {
            alert('Erreur serveur: Veuillez réessayer plus tard');
          } else {
            alert('Erreur lors de l\'envoi de la réponse');
          }
        }
      );
  }
  
  // Méthode pour supprimer un message
  deleteMessage(index: number): void {
    // Vérifications de sécurité
    if (index < 0 || index >= this.contacts.length) {
      console.error('Index invalide:', index);
      alert('Erreur: Contact non trouvé');
      return;
    }

    const contact = this.contacts[index];
    
    if (!contact) {
      console.error('Contact non trouvé à l\'index:', index);
      alert('Erreur: Contact non trouvé');
      return;
    }

    // Vérifier les différents formats possibles d'ID
    const contactId = contact._id || contact.id || contact.contactId;
    
    if (!contactId) {
      console.error('ID du contact manquant:', contact);
      alert('Erreur: ID du contact manquant');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le message de ${contact.name || 'Unknown'} ?`)) {
      console.log('Deleting contact ID:', contactId); // Debug log
      
      this.http.delete(`${this.apiUrl}/contact/delete_contact/${contactId}`)
        .subscribe(
          (response) => {
            console.log('Contact deleted successfully:', response);
            alert('Message supprimé avec succès');
            this.contacts.splice(index, 1);
            this.refreshCharts(); // Refresh charts after deleting a message
          },
          (error) => {
            console.error('Error deleting message:', error);
            if (error.status === 404) {
              alert('Erreur: Contact non trouvé dans la base de données');
            } else if (error.status === 400) {
              alert('Erreur: Données invalides');
            } else if (error.status === 500) {
              alert('Erreur serveur: Veuillez réessayer plus tard');
            } else {
              alert('Erreur lors de la suppression du message');
            }
          }
        );
    }
  }
  
  userReaction: string | null = null;
}