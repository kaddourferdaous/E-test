import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-model-detail',
  templateUrl: './model-detail.component.html',
  styleUrls: ['./model-detail.component.css']
})
export class ModelDetailComponent implements OnInit {
  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef;
  supports: any[] = [];
  selectedSupport: any = null;
  modelName: string = '';
  showContent: boolean = false;
  questions: any[] = [];
  currentQuestionIndex = 0;
  candidateId: string = '';
  candidateName: string = '';
  candidateEmail: string = '';
  fileName: string = '';
  responses: string[] = [];
  questionAnswered: boolean = false; // Indicateur pour savoir si la question a été répondue
  isRadioDisabled: boolean=false;


  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {
    console.log('Composant ModelDetailComponent initialisé');
    this.modelName = this.route.snapshot.paramMap.get('modelName') || '';
    console.log('Nom du modèle récupéré depuis l\'URL:', this.modelName);
  }

  ngOnInit(): void {
    console.log('ngOnInit appelé');
    this.loadCandidateInfo();
    this.fetchSupports();
  }

  loadCandidateInfo(): void {
    const candidateInfo = localStorage.getItem('candidateInfo');
    if (candidateInfo) {
      try {
        const candidate = JSON.parse(candidateInfo);
        this.candidateId = candidate.id || 'Inconnu';
        this.candidateName = candidate.nom || 'Inconnu';
        this.candidateEmail = candidate.email || 'Inconnu';
      } catch (error) {
        console.error('Erreur lors du parsing des informations du candidat:', error);
      }
    } else {
      console.log('Aucune information de candidat trouvée dans localStorage.');
    }
  }

  fetchSupports(): void {
    console.log('Début de la récupération des supports...');
    this.http.get<any>('http://localhost:5000/supp/supports/metadata/all').subscribe(
      (response) => {
        if (response && response.metadata) {
          this.supports = response.metadata.filter((support: any) => support.model_name === this.modelName);
          console.log('Supports filtrés:', this.supports);
        } else {
          console.error('Données mal formatées');
        }
      },
      (error) => {
        console.error('Erreur de récupération des supports:', error);
      }
    );
  }

  viewSupport(support: any): void {
    this.showContent = true;
    this.selectedSupport = support;
    this.fileName = support.filename;
    console.log('Support sélectionné:', this.selectedSupport);
  }

  backToList(): void {
    console.log('Retour à la liste des supports');
    this.showContent = false;
    this.selectedSupport = null;
    this.fileName = '';
  }

  getVideoUrl(support: any): string {
    return `http://localhost:5000/supp/supports/view?model_name=${encodeURIComponent(support.model_name)}&filename=${encodeURIComponent(support.filename)}`;
  }

  getImageUrl(support: any): string {
    return this.getVideoUrl(support);
  }

  getPdfUrl(support: any): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getVideoUrl(support));
  }

  onVideoEnded(support: any): void {
    console.log(`La vidéo ${this.fileName} a terminé sa lecture.`);
    const url = `http://localhost:5000/api/get_support_with_questions?model_name=${encodeURIComponent(support.model_name)}&support_name=${encodeURIComponent(support.filename)}`;

    this.http.get<any>(url).subscribe(
      (data) => {
        if (data.questions && data.questions.length > 0) {
          this.displayQuestionsForm(data.questions);
        } else {
          console.log('Aucune question disponible pour ce support.');
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération des questions:', error);
      }
    );
  }

  displayQuestionsForm(questions: any[]): void {
    this.questions = questions.map(q => ({
      ...q,
      selectedOption: null 
    }));
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitAnswers() {
    // Array pour stocker les réponses avec la validation 'isCorrect'
    const responses = this.questions.map(question => {
      const selectedOption = question.selectedOption; // Réponse donnée par le candidat
      const correctAnswer = question.correctAnswer; // Réponse correcte
  
      // Comparer la réponse donnée avec la bonne réponse
      const isCorrect = selectedOption === correctAnswer;
  
      return {
        questionId: question.id,
        selectedOption: selectedOption,
        isCorrect: isCorrect
      };
    });
  
    // Préparation du payload pour l'API
    const payload = {
      model_name: this.modelName,
      support_name: this.fileName,
      candidate_id: this.candidateId,
      
      answers: responses
    };
  
    // Envoi de la demande POST avec fetch
    fetch('http://localhost:5000/api/submit_answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload) // Envoi des données au serveur
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur lors de la soumission des réponses');
        }
        return response.json(); // Conversion de la réponse en JSON
      })
      .then(result => {
        console.log('Réponses sauvegardées avec succès:', result);
      })
      .catch(error => {
        console.error('Erreur lors de la sauvegarde des réponses:', error);
      });
  
    console.log("Fin de la soumission du formulaire");
  }
  
  
  getSelectedAnswer(question: any): string {
    return question.selectedOption ? question.selectedOption : 'Non répondu';
  }

  calculateScore(responses: any[]): number {
    return responses.filter(response => response.answer !== 'Non répondu').length;
  }
  checkAnswer(question: any, selectedOption: string): string {
    if (selectedOption === question.correctAnswer) {
      return 'correct-answer'; // Classe CSS pour une réponse correcte
    } else {
      return 'incorrect-answer'; // Classe CSS pour une réponse incorrecte
    }
  }
  onOptionSelected(question: any, selectedOption: any) {
    console.log('Réponse fournie:', selectedOption);
    console.log('Réponse correcte:', question.correct_answer);

    // Marquer la question comme répondue
    question.selectedOption = selectedOption;
    question.isAnswered = true; // La question a été répondue
    this.questionAnswered = true;

    // Vérification de la réponse
    if (this.isAnswerCorrect(question, selectedOption)) {
      console.log('La réponse est correcte');
    } else {
      console.log('La réponse est incorrecte');
    }
  }

  // Vérification si la réponse est correcte (ignorant la casse)
  isAnswerCorrect(question: any, option: any): boolean {
    // Comparer en minuscules pour ignorer la casse
    return option.toLowerCase() === question.correct_answer.toLowerCase();
  }
  disableRadioButtons() {
    this.isRadioDisabled = true;
  }
}
