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
  questionAnswered: boolean = false;
  isRadioDisabled: boolean = false;

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

 // Update the displayQuestionsForm method to properly initialize selectedOptions
 displayQuestionsForm(questions: any[]): void {
  this.questions = this.setMultipleChoiceFlag(questions);
  this.currentQuestionIndex = 0;
  this.questionAnswered = false;
}
setMultipleChoiceFlag(questions: any[]): any[] {
  return questions.map(question => {
    // Ensure correctAnswers is always an array
    const correctAnswers = question.correct_answer ? 
      (Array.isArray(question.correct_answer) ? question.correct_answer : [question.correct_answer]) : 
      [];
    
    // Set isMultipleChoice based on correctAnswers length
    question.isMultipleChoice = correctAnswers.length > 1;
    
    // Add other necessary properties
    return {
      ...question,
      correctAnswers,
      selectedOption: null,
      selectedOptions: [],
      isAnswered: false
    };
  });
}

// Your onOptionSelected is properly handling multiple choice already
// But let's ensure it works with checkboxes in the HTML
  displayQuestions(support: any): void {
    this.selectedSupport = support;  // Set the selectedSupport property
    this.fileName = support.filename; // Set the fileName property
    
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
  

  


  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.questionAnswered = false;
    }
  }
  
  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.questionAnswered = false;
    }
  }
  
  getSelectedAnswer(question: any): string {
    return question.selectedOption ? question.selectedOption : 'Non répondu';
  }

  calculateScore(responses: any[]): number {
    return responses.filter(response => response.answer !== 'Non répondu').length;
  }

  disableRadioButtons() {
    this.isRadioDisabled = true;
  }

  // Fonction pour valider les questions à choix multiple
  validateMultipleChoiceAnswer(question: any): void {
    if (question.isMultipleChoice && question.selectedOptions && question.selectedOptions.length > 0) {
      question.isAnswered = true; // Marquer comme répondu pour afficher le feedback
      
      // Optionally, you can calculate and display the score right away
      const selectedOptions = question.selectedOptions || [];
      const correctAnswers = question.correctAnswers || [];
      
      const correctSelected = selectedOptions.filter((opt: string) =>
        correctAnswers.some((ans: string) => ans.toLowerCase() === opt.toLowerCase())
      ).length;
      
      const totalCorrect = correctAnswers.length;
      const score = totalCorrect > 0 ? (correctSelected / totalCorrect) * 100 : 0;
      
      console.log(`Question ${question.id} - Multiple Choice validated:`, {
        selectedOptions,
        correctAnswers,
        score: `${score}%`
      });
    }
  }
  onOptionSelected(question: any, selectedOption: any) {
    console.log('Option selected:', selectedOption, 'for question:', question.text); // Add debug log
    
    if (question.isMultipleChoice) {
      // Always initialize selectedOptions if it's undefined or null
      if (!question.selectedOptions) {
        question.selectedOptions = [];
        console.log('Initialized selectedOptions array'); // Debug log
      }
      
      const index = question.selectedOptions.indexOf(selectedOption);
      if (index === -1) {
        // Add option
        question.selectedOptions.push(selectedOption);
        console.log('Added option. Current selections:', question.selectedOptions); // Debug log
      } else {
        // Remove option
        question.selectedOptions.splice(index, 1);
        console.log('Removed option. Current selections:', question.selectedOptions); // Debug log
      }
    } else {
      // For single choice questions
      question.selectedOption = selectedOption;
      question.isAnswered = true;
    }
  }
  isAnswerCorrect(question: any, option: string): boolean {
    if (!question.correctAnswers) {
      return false;
    }
    
    return question.correctAnswers.some((correctAnswer: string) => 
      correctAnswer.toLowerCase() === option.toLowerCase()
    );
  }

  isOptionSelected(question: any, option: any): boolean {
    if (question.isMultipleChoice) {
      return question.selectedOptions && question.selectedOptions.includes(option);
    } else {
      return question.selectedOption === option;
    }
  }

  isQuestionAnswered(question: any): boolean {
    if (question.isMultipleChoice) {
      return question.selectedOptions && question.selectedOptions.length > 0;
    } else {
      return question.selectedOption !== null;
    }
  }

  submitAnswers(support: any = null) {
    // If a support is provided, use its filename
    if (support && support.filename) {
      this.fileName = support.filename;
    }
    // If no support is provided or filename is missing, use the existing fileName or default
    else if (!this.fileName) {
      this.fileName = 'non_defini';
    }
  
    // Marquer toutes les questions comme répondues
    this.questions.forEach(question => {
      question.isAnswered = true;
    });
  
    // Log des infos principales
    console.log('Model Name:', this.modelName);
    console.log('File Name (support_name):', this.fileName);
    console.log('Candidate ID:', this.candidateId);
  
    // Construction des réponses
    const responses = this.questions.map(question => {
      if (question.isMultipleChoice) {
        const selectedOptions = question.selectedOptions || [];
        const correctAnswers = question.correctAnswers || [];
  
        const correctSelected = selectedOptions.filter((opt: string) =>
          correctAnswers.some((ans: string) => ans.toLowerCase() === opt.toLowerCase())
        ).length;
  
        const totalCorrect = correctAnswers.length;
        const score = totalCorrect > 0 ? (correctSelected / totalCorrect) * 100 : 0;
  
        console.log(`Question ${question.id} - Multiple Choice:`, {
          selectedOptions,
          correctAnswers,
          score
        });
  
        return {
          questionId: question.id,
          selectedOptions,
          isCorrect: score === 100,
          partialScore: score
        };
      } else {
        const selectedOption = question.selectedOption || '';
        const correctAnswers = question.correctAnswers || [];
  
        const isCorrect = correctAnswers.some((ans: string) =>
          ans.toLowerCase() === selectedOption.toLowerCase()
        );
  
        console.log(`Question ${question.id} - Single Choice:`, {
          selectedOption,
          correctAnswers,
          isCorrect
        });
  
        return {
          questionId: question.id,
          selectedOption,
          isCorrect
        };
      }
    });
  
    // Préparation du payload
    const payload = {
      model_name: this.modelName || 'inconnu',
      support_name: this.fileName,
      candidate_id: this.candidateId || 'anonyme',
      answers: responses
    };
  
    console.log('Payload à envoyer:', payload);
  
    // Envoi vers l'API
    this.http.post('http://localhost:5000/api/submit_answers', payload)
      .subscribe({
        next: (result) => {
          console.log('Réponses sauvegardées avec succès:', result);
          this.disableRadioButtons(); // désactiver les radios après soumission
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde des réponses:', error);
        }
      });
  }
  
}