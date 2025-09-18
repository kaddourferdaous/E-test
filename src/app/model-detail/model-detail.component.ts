import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslationService } from '../translation.service';
import { CandidateProgress, ProgressService } from '../ProgressService.service';

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string[];
  isMultipleChoice: boolean;
  isAnswered: boolean;
  selectedOptions: string[];
  original_text?: string; // Store original English text
  original_options?: string[]; // Store original English options
  original_correct_answer?: string[]; // Store original English correct answers
}

interface Support {
  id: string;
  filename: string;
  description: string;
  tags: string[];
  expectation: string;
  upload_date: string;
  model_name: string;
  model_day: number;
  questions: Question[];
  match_type: string;
}

interface ApiResponse {
  supports: Support[];
}

@Component({
  selector: 'app-model-detail',
  templateUrl: './model-detail.component.html',
  styleUrls: ['./model-detail.component.css']
})
export class ModelDetailComponent implements OnInit {
  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef;

  // Properties
  supports: any[] = [];
  selectedSupport: any = null;
  modelName: string = '';
  showContent: boolean = false;
  questions: any[] = [];
  currentQuestionIndex: number = 0;
  candidateId: string = '';
  candidateName: string = '';
  candidateEmail: string = '';
  fileName: string = '';
  responses: string[] = [];
  questionAnswered: boolean = false;
  isRadioDisabled: boolean = false;
  selectedLanguage: string | undefined = 'ar'; // Default to Arabic for this example
  isTestCompleted: boolean = false;
  errorMessage: string | null = null;
 loadingModelDetails: { [key: string]: boolean } = {}; // Track loading par modèle
  loadingMessage: string = 'Chargement des détails du modèle...';
  isLoadingSupports: boolean = false;
isLoadingQuestions: boolean = false;
isSubmittingAnswers: boolean = false;
 candidateProgress: CandidateProgress | null = null;
  videoStartTime: number = 0;
  videoDuration: number = 0;
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private progressService:ProgressService,
    private translationService: TranslationService // Inject TranslationService
  ) {
    console.log('Composant ModelDetailComponent initialisé');
    this.modelName = this.route.snapshot.paramMap.get('modelName') || '';
    console.log('Nom du modèle récupéré depuis l\'URL:', this.modelName);
  }

  ngOnInit(): void {
    console.log('ngOnInit appelé');
    this.loadCandidateInfo();
    this.fetchSupports();
    
    this.loadCandidateProgress(); // Nouveau
  }
loadCandidateProgress(): void {
    if (this.candidateId && this.modelName) {
      this.progressService.getCandidateProgress(this.candidateId, this.modelName)
        .subscribe({
          next: (progress) => {
            this.candidateProgress = progress;
            console.log('Avancement du candidat chargé:', progress);
            this.updateSupportCompletionStatus();
          },
          error: (error) => {
            console.error('Erreur lors du chargement de l\'avancement:', error);
          }
        });
    }
  }
  viewSupport(support: any): void {
    this.showContent = true;
    this.selectedSupport = support;
    this.fileName = support.filename;
    
    // Enregistrer le début de visualisation
    this.videoStartTime = Date.now();
    
    console.log('Support sélectionné:', this.selectedSupport);
  }

  // Méthode améliorée quand la vidéo se termine
  onVideoEnded(support: any): void {
    console.log(`La vidéo ${this.fileName} a terminé sa lecture.`);
    
    // Calculer la durée de visionnage
    const viewDuration = Math.floor((Date.now() - this.videoStartTime) / 1000);
    
    // Marquer comme visualisé dans le backend
    this.markSupportAsViewedInBackend(support, viewDuration);
    
    // Charger les questions
    this.fetchQuestionsForSupport(support);
  }

  // Nouvelle méthode pour enregistrer la visualisation dans le backend
  markSupportAsViewedInBackend(support: any, duration: number): void {
    if (this.candidateId) {
      this.progressService.markSupportAsViewed(
        this.candidateId,
        support.id,
        support.model_name,
        support.filename,
        duration
      ).subscribe({
        next: (response) => {
          console.log('Support marqué comme visualisé:', response);
          // Mettre à jour l'avancement local
          this.loadCandidateProgress();
        },
        error: (error) => {
          console.error('Erreur lors de l\'enregistrement de la visualisation:', error);
        }
      });
    }
  }
  // Mettre à jour le statut de complétion des supports
  updateSupportCompletionStatus(): void {
    if (this.candidateProgress && this.supports) {
      this.supports.forEach(support => {
        const progressInfo = this.candidateProgress?.supports_progress
          .find(p => p.support_id === support.id || p.filename === support.filename);
        
        if (progressInfo) {
          support.viewed = progressInfo.viewed;
          support.questionsAnswered = progressInfo.questions_answered;
          support.completed = progressInfo.viewed && progressInfo.questions_answered;
          support.score = progressInfo.questions_score;
          support.totalQuestions = progressInfo.questions_total;
        }
      });
    }
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



// Méthode alternative pour récupérer TOUS les fichiers (Drive + métadonnées)
fetchAllFiles(): void {
  console.log('Récupération de tous les fichiers Drive...');
  
  this.http.get<any>('https://training-backend-1pda.onrender.com/api/supports/drive/all').subscribe({
    next: (response) => {
      console.log('Réponse Drive complète:', response);
      
      if (response && response.success) {
        let files = [];
        
        // Gérer les deux formats possibles de réponse
        if (response.data && response.data.files) {
          files = response.data.files;
        } else if (response.files) {
          files = response.files;
        }
        
        console.log('Tous les fichiers Drive:', files);
        console.log('Types de fichiers disponibles:', [...new Set(files.map((f: any) => f.file_type))]);
        console.log('Extensions disponibles:', [...new Set(files.map((f: any) => f.file_extension))]);
        
        // Filtrer par model_name (si métadonnées disponibles)
        const supportsWithMetadata = files.filter((file: any) => {
          return file.has_metadata && 
                 file.metadata && 
                 file.metadata.model_name === this.modelName;
        });
        
        console.log(`Fichiers avec métadonnées pour ${this.modelName}:`, supportsWithMetadata);
        
        // Transformer le format pour compatibilité
        this.supports = supportsWithMetadata.map((file: any) => ({
          id: file.metadata.id,
          filename: file.filename,
          description: file.metadata.description,
          tags: file.metadata.tags || [],
          expectation: file.metadata.expectation,
          model_name: file.metadata.model_name,
          model_day: file.metadata.model_day,
          upload_date: file.metadata.upload_date,
          
          // Informations Drive
          drive_id: file.drive_id,
          file_type: file.file_type,
          file_extension: file.file_extension,
          folder_type: file.folder_type,
          view_url: file.view_url,
          download_url: file.download_url,
          web_view_link: file.web_view_link,
          
          // Questions
          questions: file.questions || [],
          questions_count: file.questions ? file.questions.length : 0,
          
          // Flags
          has_metadata: true,
          drive_file_exists: true
        }));
        
        console.log('Supports finaux:', this.supports);
      } else {
        console.error('Erreur dans la réponse Drive:', response);
      }
    },
    error: (error) => {
      console.error('Erreur de récupération des fichiers Drive:', error);
    }
  });
}

// Méthode de debug pour vérifier la configuration
debugDriveConfiguration(): void {
  console.log('=== DEBUG CONFIGURATION DRIVE ===');
  
  this.http.get<any>('https://training-backend-1pda.onrender.com/api/supports/drive/stats').subscribe({
    next: (response) => {
      console.log('Statistiques Drive:', response);
      if (response.data) {
        console.log('Total fichiers:', response.data.total_files);
        console.log('Par dossier:', response.data.by_folder);
        console.log('Par type:', response.data.by_type);
        console.log('Par extension:', response.data.by_extension);
        console.log('Avec métadonnées:', response.data.with_metadata);
        console.log('Sans métadonnées:', response.data.without_metadata);
      }
    },
    error: (error) => {
      console.error('Erreur stats Drive:', error);
    }
  });
  
  // Tester la connexion Drive
  this.http.get<any>('https://training-backend-1pda.onrender.com/api/supports/test').subscribe({
    next: (response) => {
      console.log('Test API:', response);
    },
    error: (error) => {
      console.error('Erreur test API:', error);
    }
  });
}
 

  backToList(): void {
    console.log('Back to the list');
    this.showContent = false;
    this.selectedSupport = null;
    this.fileName = '';
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.questionAnswered = false;
    this.isRadioDisabled = false;
  }

  getVideoUrl(support: any): string {
    return `https://training-backend-1pda.onrender.com/api/supports/view?model_name=${encodeURIComponent(support.model_name)}&filename=${encodeURIComponent(support.filename)}`;
  }

  getImageUrl(support: any): string {
    return this.getVideoUrl(support);
  }

  getPdfUrl(support: any): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getVideoUrl(support));
  }

 

// Nouvelle méthode pour revenir aux supports depuis les questions
backToSupports(): void {
  this.questions = [];
  this.currentQuestionIndex = 0;
  this.selectedSupport = null;
  this.showContent = false;
}



  displayQuestionsForm(questions: any[]): void {
    this.questions = this.setMultipleChoiceFlag(questions);
    this.currentQuestionIndex = 0;
    this.questionAnswered = false;
    this.isRadioDisabled = false;
  }

  setMultipleChoiceFlag(questions: any[]): any[] {
    return questions.map(question => {
      const correctAnswers = question.correct_answer || [];
      const isMultipleChoice = correctAnswers.length > 1;
      return {
        ...question,
        correctAnswers,
        isMultipleChoice,
        selectedOption: null,
        selectedOptions: [],
        isAnswered: false
      };
    });
  }

 displayQuestions(support: any): void {
  this.selectedSupport = support;
  this.fileName = support.filename;
  
  // Activer le loading pour les questions
  this.loadingModelDetails[this.modelName] = true;
  this.loadingMessage = 'Chargement des questions...';
  
  this.fetchQuestionsForSupport(support);
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

  disableRadioButtons(): void {
    this.isRadioDisabled = true;
  }

  validateMultipleChoiceAnswer(question: any): void {
    if (question.isMultipleChoice && question.selectedOptions && question.selectedOptions.length > 0) {
      question.isAnswered = true;
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

onOptionSelected(question: any, selectedOption: string): void {
  console.log('Option selected:', selectedOption, 'for question:', question.text);

  if (question.isMultipleChoice) {
    if (!question.selectedOptions) {
      question.selectedOptions = [];
      console.log('Initialized selectedOptions array');
    }
    const index: number = question.selectedOptions.indexOf(selectedOption);
    if (index === -1) {
      question.selectedOptions.push(selectedOption);
      console.log('Added option. Current selections:', question.selectedOptions);
    } else {
      question.selectedOptions.splice(index, 1);
      console.log('Removed option. Current selections:', question.selectedOptions);
    }
  } else {
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

  checkTestCompletion(): void {
    this.isTestCompleted = this.questions.every(q => q.isAnswered);
  }

  skipTest(): void {
    console.log('Test skipped');
    this.router.navigate(['/test']);
  }

fetchSupports(): void {
  console.log('Début de la récupération des supports...');
  console.log('Model name recherché:', this.modelName);
  
  // Activer le loader
  this.isLoadingSupports = true;

  this.http.get<any>('https://training-backend-1pda.onrender.com/api/supports/metadata/all', {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
  }).subscribe({
    next: (response) => {
      console.log('Réponse complète reçue:', response);

      // Vérifier le format correct de la réponse
      if (response && response.success && response.files) {
        console.log('Tous les supports disponibles:', response.files);

        // Filtrer par model_name
        this.supports = response.files
          .filter((file: any) => file.has_metadata && file.metadata && file.metadata.model_name === this.modelName)
          .map((file: any) => ({
            id: file.metadata.id,
            filename: file.filename,
            description: file.metadata.description,
            tags: file.metadata.tags || [],
            expectation: file.metadata.expectation,
            model_name: file.metadata.model_name,
            model_day: file.metadata.model_day,
            upload_date: file.metadata.upload_date,
            drive_id: file.drive_id,
            file_type: file.file_type,
            file_extension: file.file_extension,
            folder_type: file.folder_type,
            view_url: file.view_url,
            download_url: file.download_url,
            web_view_link: file.web_view_link,
            questions: file.questions || [],
            questions_count: file.questions ? file.questions.length : 0,
            has_metadata: true,
            drive_file_exists: true
          }));

        console.log(`Supports filtrés pour ${this.modelName}:`, this.supports);
        console.log(`Nombre de supports trouvés: ${this.supports.length}`);

        if (this.supports.length === 0) {
          this.errorMessage = `Aucun support trouvé pour le modèle ${this.modelName}`;
        }
      } else {
        this.errorMessage = 'Format de réponse invalide. Structure attendue: response.files';
        console.error('Structure reçue:', Object.keys(response || {}));
      }
      
      // Désactiver le loader
      this.isLoadingSupports = false;
    },
    error: (error) => {
      console.error('Erreur de récupération des supports:', error);
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      this.errorMessage = `Erreur lors de la récupération des supports: ${error.message}`;
      
      // Désactiver le loader en cas d'erreur
      this.isLoadingSupports = false;
    }
  });
}

// Modifiez la méthode fetchQuestionsForSupport() pour gérer le loader
private fetchQuestionsForSupport(support: { model_name: string; filename: string }): void {
  const url = `https://training-backend-1pda.onrender.com/api/get_support_with_questions?model_name=${encodeURIComponent(support.model_name)}${support.filename ? `&support_name=${encodeURIComponent(support.filename)}` : ''}`;

  // Activer le loader des questions
  this.isLoadingQuestions = true;
  
  this.http.get<ApiResponse>(url).subscribe({
    next: (data) => {
      if (!data.supports || data.supports.length === 0) {
        this.errorMessage = 'Aucun support trouvé pour les paramètres fournis.';
        console.log(this.errorMessage);
        this.isLoadingQuestions = false;
        return;
      }

      // Aplatir les questions et appliquer les traductions
      this.questions = data.supports.flatMap(support => {
        this.selectedSupport = data.supports[0];
        return support.questions.map(question => {
          const parsedOptions = Array.isArray(question.options)
            ? question.options
            : typeof question.options === 'string'
            ? JSON.parse(question.options)
            : [];
          const parsedCorrectAnswer = Array.isArray(question.correct_answer)
            ? question.correct_answer
            : typeof question.correct_answer === 'string'
            ? JSON.parse(question.correct_answer)
            : [];

          // Store original values
          const originalQuestion = {
            text: question.text,
            options: parsedOptions,
            correct_answer: parsedCorrectAnswer
          };

          // Translate if selectedLanguage is 'ar'
          const translatedQuestion = this.selectedLanguage === 'ar'
            ? this.translationService.translateQuestionWithOptions({
                text: question.text,
                options: parsedOptions,
                correct_answer: parsedCorrectAnswer
              })
            : originalQuestion;

          return {
            ...question,
            text: translatedQuestion.text,
            options: translatedQuestion.options,
            correct_answer: translatedQuestion.correct_answer,
            isMultipleChoice: parsedCorrectAnswer.length > 1,
            isAnswered: false,
            selectedOptions: [],
            original_text: originalQuestion.text,
            original_options: originalQuestion.options,
            original_correct_answer: originalQuestion.correct_answer
          };
        });
      });

      if (this.questions.length > 0) {
        this.displayQuestionsForm(this.questions);
      } else {
        this.errorMessage = 'Aucune question disponible pour ce support.';
        console.log(this.errorMessage);
      }
      
      // Désactiver le loader des questions
      this.isLoadingQuestions = false;
    },
    error: (error) => {
      this.errorMessage = `Erreur lors de la récupération des questions: ${error.message}`;
      console.error('Erreur lors de la récupération des questions:', error);
      
      // Désactiver le loader en cas d'erreur
      this.isLoadingQuestions = false;
    }
  });
}

// Modifiez la méthode submitAnswers() pour gérer le loader
submitAnswers(support: any): void {
  // Activer le loader de soumission
  this.isSubmittingAnswers = true;
  
  const answers = this.questions.map(question => ({
    question_id: question.id,
    selected_options: question.selectedOptions || []
  }));

  const payload = {
    support_id: support.id,
    answers: answers
  };

  console.log('Réponses préparées (non envoyées) :', payload);

  // Simuler un délai de traitement
  setTimeout(() => {
    // Simule une soumission réussie
    this.errorMessage = '✅ OK – les réponses ont été "envoyées" (localement)';

    // Facultatif : marquer les questions comme répondues
    this.questions.forEach(question => {
      question.isAnswered = true;
      question.isCorrect = null;
    });
    
    // Désactiver le loader de soumission
    this.isSubmittingAnswers = false;
    
    alert('📨 Réponses envoyées avec succès !');
  }, 1500); // Simuler 1.5 seconde de traitement
}

  private showSuccessMessage(): void {
    alert('Vos réponses ont été enregistrées avec succès');
  }

  private showWarningMessage(message: string): void {
    alert(`Avertissement: ${message}`);
  }

  private showErrorMessage(error: any): void {
    alert(`Erreur lors de l'enregistrement: ${error.message || 'Erreur inconnue'}`);
  }

  shouldShowTestButton(): boolean {
    if (!this.supports || this.supports.length === 0) {
      return false;
    }
    const currentDay = this.getCurrentDay();
    const supportsForCurrentDay = this.getSupportsForDay(currentDay);
    if (supportsForCurrentDay.length === 0) {
      return false;
    }
    return supportsForCurrentDay.every(support => this.isSupportCompleted(support));
  }

  getCurrentDay(): string {
    if (!this.supports || this.supports.length === 0) {
      return '1';
    }
    const lastSupport = this.supports[this.supports.length - 1];
    if (lastSupport.day) {
      return lastSupport.day.toString();
    }
    const dayMatch = lastSupport.filename?.match(/day(\d+)/i);
    if (dayMatch) {
      return dayMatch[1];
    }
    const supportsPerDay = 5;
    const currentDay = Math.ceil(this.supports.length / supportsPerDay);
    return currentDay.toString();
  }

  getSupportsForDay(day: string): any[] {
    if (!this.supports) {
      return [];
    }
    return this.supports.filter(support => {
      if (support.day) {
        return support.day.toString() === day;
      }
      const dayMatch = support.filename?.match(/day(\d+)/i);
      if (dayMatch) {
        return dayMatch[1] === day;
      }
      return false;
    });
  }

  isSupportCompleted(support: any): boolean {
    if (!support) {
      return false;
    }
    const hasBeenViewed = this.hasBeenViewed(support);
    const questionsAnswered = this.hasAnsweredQuestions(support);
    return hasBeenViewed && questionsAnswered;
  }

  hasBeenViewed(support: any): boolean {
    const viewedSupports = JSON.parse(localStorage.getItem('viewedSupports') || '[]');
    return viewedSupports.includes(support.id || support.filename);
  }

  hasAnsweredQuestions(support: any): boolean {
    const answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions') || '{}');
    return answeredQuestions[support.id || support.filename] === true;
  }



 getProgressStats(): any {
    if (!this.candidateProgress) {
      return {
        completion: 0,
        viewed: 0,
        total: this.supports?.length || 0,
        averageScore: 0,
        totalTime: 0
      };
    }

    return {
      completion: this.candidateProgress.completion_percentage,
      viewed: this.candidateProgress.viewed_supports,
      total: this.candidateProgress.total_supports,
      averageScore: this.candidateProgress.average_score,
      totalTime: this.candidateProgress.total_time_spent
    };
  }

  // Méthode pour vérifier si le candidat peut passer au test
  canTakeTest(): boolean {
    if (!this.candidateProgress) {
      return false;
    }
    
    // Le candidat peut passer le test si tous les supports ont été complétés
    return this.candidateProgress.completion_percentage >= 100;
  }

  // Méthode pour obtenir le support suivant à compléter
  getNextIncompleteSupport(): any {
    if (!this.candidateProgress || !this.supports) {
      return null;
    }

    return this.supports.find(support => !this.isSupportCompleted(support));
  }

  markSupportAsViewed(support: any): void {
    const viewedSupports = JSON.parse(localStorage.getItem('viewedSupports') || '[]');
    const supportId = support.id || support.filename;
    if (!viewedSupports.includes(supportId)) {
      viewedSupports.push(supportId);
      localStorage.setItem('viewedSupports', JSON.stringify(viewedSupports));
    }
  }

  markQuestionsAsAnswered(support: any): void {
    const answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions') || '{}');
    const supportId = support.id || support.filename;
    answeredQuestions[supportId] = true;
    localStorage.setItem('answeredQuestions', JSON.stringify(answeredQuestions));
  }

  navigateToTest(): void {
    this.router.navigate(['/test']);
  }
  onVideoLoaded(){const video=
    this.videoPlayer.nativeElement;

  }
}