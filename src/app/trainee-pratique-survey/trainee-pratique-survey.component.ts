import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

// Interfaces
interface SurveyQuestion {
  question_id: number;
  category: string;
  title: string;
  text_en: string;
  text_ar: string;
  _id?: string;
}

interface RatingOption {
  key: string;
  text_en: string;
  text_ar: string;
}

interface SurveyResponse {
  question_id: number;
  rating: string;
  observation?: string;
}

interface SurveySubmissionWithQuestions {
  trainee_id: string;
  session_id: string;
  responses: SurveyResponse[];
  questions?: SurveyQuestion[];
}

interface CandidateInfo {
  id: string;
  nom: string;
  email: string;
}

@Component({
  selector: 'app-trainee-pratique-survey',
  templateUrl: './trainee-pratique-survey.component.html',
  styleUrls: ['./trainee-pratique-survey.component.css']
})
export class TraineePratiqueSurveyComponent implements OnInit {
  // Form related properties
  surveyForm: FormGroup;
  submitted = false;
  isSubmitting = false;
  
  // Candidate information
  candidateId: string | null = null;
  candidateName: string | null = null;
  candidateEmail: string | null = null;
  
  // UI state
  currentLanguage: 'en' | 'ar' = 'en';
  loading = true;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  // Data
  questions: SurveyQuestion[] = [];
  
  // Rating options
  ratingOptions: RatingOption[] = [
    { key: 'very_satisfied', text_en: 'Very Satisfied', text_ar: 'راض جدا' },
    { key: 'satisfied', text_en: 'Satisfied', text_ar: 'راض' },
    { key: 'not_satisfied', text_en: 'Not Satisfied', text_ar: 'غير راض' }
  ];
  
  // UI text translations
  uiTexts = {
    'en': {
      formTitle: 'Training Evaluation Survey',
      traineeId: 'Trainee ID:',
      sessionId: 'Session ID:',
      observationLabel: 'Observation (optional):',
      submitButton: 'Submit Survey',
      traineeIdRequired: 'Trainee ID is required',
      sessionIdRequired: 'Session ID is required',
      ratingRequired: 'Please select a rating',
      successMessage: 'Survey submitted successfully!',
      errorMessage: 'Failed to submit survey. Please try again.',
      candidateInfoError: 'Unable to load candidate information'
    },
    'ar': {
      formTitle: 'استبيان تقييم التدريب',
      traineeId: 'معرف المتدرب:',
      sessionId: 'معرف الجلسة:',
      observationLabel: 'ملاحظة (اختياري):',
      submitButton: 'إرسال الاستبيان',
      traineeIdRequired: 'معرف المتدرب مطلوب',
      sessionIdRequired: 'معرف الجلسة مطلوب',
      ratingRequired: 'يرجى اختيار تقييم',
      successMessage: 'تم إرسال الاستبيان بنجاح!',
      errorMessage: 'فشل في إرسال الاستبيان. حاول مرة اخرى.',
      candidateInfoError: 'تعذر تحميل معلومات المرشح'
    }
  };
  
  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Initialize form with minimal fields
    this.surveyForm = this.formBuilder.group({
      traineeId: [''],
      sessionId: ['']
    });
    
    console.log('TraineePratiqueSurveyComponent initialized');
  }
  
  ngOnInit() {
    console.log('ngOnInit called');
    // Load candidate info before loading questions
    this.loadCandidateInfo()
      .then(() => {
        console.log('Candidate info loaded successfully, loading questions');
        this.loadQuestions();
      })
      .catch(error => {
        console.error('Error initializing survey:', error);
        this.loading = false;
        this.errorMessage = this.uiTexts[this.currentLanguage].candidateInfoError;
      });
  }
  
  // Méthode centralisée pour obtenir l'ID du stagiaire
  private getCurrentTraineeId(): string {
    console.log('getCurrentTraineeId called');
    
    // 1. Essayer de récupérer l'ID du candidat (connexion par ID - stocké dans candidateId)
    let traineeId = this.authService.getCandidateId();
    if (traineeId) {
      console.log('ID du candidat trouvé via authService.getCandidateId():', traineeId);
      return traineeId;
    }
    
    // 2. Essayer de récupérer l'ID du trainee (connexion par matricule - stocké dans traineeId)
    traineeId = this.authService.getTraineeId();
    if (traineeId) {
      console.log('ID du trainee trouvé via authService.getTraineeId():', traineeId);
      return traineeId;
    }
    
    // 3. Fallback sur candidateId (provenant de localStorage dans ce composant)
    if (this.candidateId) {
      console.log('ID du candidat trouvé via this.candidateId:', this.candidateId);
      return this.candidateId;
    }
    
    console.warn('Aucun ID de stagiaire trouvé');
    return '';
  }
  
  // Promise-based method to load candidate information
  loadCandidateInfo(): Promise<void> {
    console.log('loadCandidateInfo called');
    return new Promise((resolve, reject) => {
      const candidateInfo = localStorage.getItem('candidateInfo');
      console.log('Candidate info from localStorage:', candidateInfo);
      
      if (candidateInfo) {
        try {
          const candidate: CandidateInfo = JSON.parse(candidateInfo);
          console.log('Successfully parsed candidate info from localStorage:', candidate);
          this.updateCandidateInfo(candidate);
          resolve();
        } catch (error) {
          console.warn('Error parsing localStorage candidate info, fetching from API:', error);
          this.loadCandidateInfoFromAPI(resolve, reject);
        }
      } else {
        console.log('No candidate info in localStorage, fetching from API');
        this.loadCandidateInfoFromAPI(resolve, reject);
      }
    });
  }
  
  // Update candidate information and form
  private updateCandidateInfo(candidate: CandidateInfo) {
    console.log('updateCandidateInfo called with:', candidate);
    this.candidateId = candidate.id || 'Unknown';
    this.candidateName = candidate.nom || 'Unknown';
    this.candidateEmail = candidate.email || 'Unknown';
    
    console.log('Candidate information loaded:', {
      candidateId: this.candidateId,
      candidateName: this.candidateName,
      candidateEmail: this.candidateEmail
    });
  }
  
  // Load candidate info from API
  private loadCandidateInfoFromAPI(resolve: () => void, reject: (error: any) => void) {
    console.log('loadCandidateInfoFromAPI called');
    this.authService.getCandidateInfo().subscribe(
      (data: CandidateInfo) => {
        console.log('API returned candidate info:', data);
        // Store in localStorage for future use
        localStorage.setItem('candidateInfo', JSON.stringify(data));
        
        // Update candidate info
        this.updateCandidateInfo(data);
        
        resolve();
      },
      error => {
        console.error('Error loading candidate information from API:', error);
        reject(error);
      }
    );
  }
  
  // Load survey questions
  loadQuestions() {
    console.log('loadQuestions called');
    this.loading = true;
    
    this.http.get<SurveyQuestion[]>('https://training-backend-1pda.onrender.com/eval/trainee/pratique/survey-questions')
      .subscribe({
        next: (data) => {
          console.log('Questions loaded from API:', data);
          this.questions = data;
          this.initializeForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading questions from API:', error);
          // Fallback to mock questions if API fails
          console.log('Falling back to mock questions');
          this.questions = this.getMockQuestions();
          console.log('Mock questions loaded:', this.questions);
          this.initializeForm();
          this.loading = false;
        }
      });
  }
  
  // Mock questions for fallback
  getMockQuestions(): SurveyQuestion[] {
    console.log('getMockQuestions called');
    return [
      {
        question_id: 1,
        category: "OLS trainer",
        title: "Capacity",
        text_en: "Ability to adapt to learners' needs",
        text_ar: "القدرة على التكيف مع احتياجات المتعلمين"
      },
      // ... (rest of your mock questions)
    ];
  }
  
  // Initialize form with dynamic question controls
  initializeForm() {
    console.log('initializeForm called');
    
    // Utiliser la méthode centralisée pour obtenir l'ID du stagiaire
    const currentTraineeId = this.getCurrentTraineeId();
    console.log('Current trainee ID for form initialization:', currentTraineeId);
    
    const formControls: { [key: string]: any } = {
      traineeId: [currentTraineeId, Validators.required],
      sessionId: ['']
    };

    // Add form groups for each question
    this.questions.forEach(question => {
      formControls[`question${question.question_id}`] = this.formBuilder.group({
        rating: ['', Validators.required],
        observation: [''] // Optional field
      });
    });

    console.log('Form controls created:', formControls);
    this.surveyForm = this.formBuilder.group(formControls);
    console.log('Survey form initialized:', this.surveyForm.value);
  }
  
  // Helper method to get form control for a specific question
  getQuestionControl(questionId: number, field: string) {
    const questionGroup = this.surveyForm.get(`question${questionId}`);
    return questionGroup ? questionGroup.get(field) : null;
  }
  
  // Language change method
  changeLanguage(lang: 'en' | 'ar') {
    console.log('Language changed to:', lang);
    this.currentLanguage = lang;
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
  
  // Handle successful survey submission
  private handleSuccessSubmission() {
    console.log('handleSuccessSubmission called');
    this.isSubmitting = false;
    this.successMessage = this.uiTexts[this.currentLanguage].successMessage;
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      console.log('Clearing success message after 5 seconds');
      this.successMessage = null;
    }, 5000);
  }
  
  // Handle submission error
  private handleSubmissionError(error: any) {
    console.error('handleSubmissionError called with:', error);
    this.isSubmitting = false;
    
    // In development, show success for testing
    if (this.isDevelopmentMode()) {
      console.log('In development mode - showing success message despite error');
      this.handleSuccessSubmission();
      return;
    }
    
    // Show error message
    this.errorMessage = this.uiTexts[this.currentLanguage].errorMessage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Check if in development mode
  private isDevelopmentMode(): boolean {
    const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    console.log('isDevelopmentMode:', isDev);
    return isDev;
  }

  // Form submission method
  onSubmit() {
    console.log('onSubmit appelé');
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;
    
    console.log('Valeur du formulaire avant validation:', this.surveyForm.value);
    console.log('Statut de validation du formulaire:', this.surveyForm.valid);
    
    // Valider le formulaire
    if (this.surveyForm.invalid) {
      console.error('Le formulaire est invalide', this.surveyForm.errors);
      // Afficher les erreurs spécifiques pour chaque contrôle
      Object.keys(this.surveyForm.controls).forEach(key => {
        const control = this.surveyForm.get(key);
        if (control && control.invalid) {
          console.error(`Le contrôle ${key} est invalide:`, control.errors);
        }
      });
      
      // Faire défiler vers la première erreur
      const firstInvalidElement = document.querySelector('.validation-error');
      if (firstInvalidElement) {
        firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    this.isSubmitting = true;
    const formData = this.surveyForm.value;
    console.log('Données du formulaire à traiter:', formData);
    
    // Utiliser la méthode centralisée pour obtenir l'ID du stagiaire
    const traineeId = this.getCurrentTraineeId();
    
    if (!traineeId) {
      console.error('Aucun ID de stagiaire trouvé - utilisateur non connecté');
      this.errorMessage = 'Erreur: Aucun stagiaire connecté trouvé';
      this.isSubmitting = false;
      return;
    }
    
    console.log('ID du stagiaire utilisé pour la soumission:', traineeId);
    
    // Préparer les données de soumission avec l'ID du stagiaire récupéré
    const submission: SurveySubmissionWithQuestions = {
      trainee_id: traineeId,
      session_id: formData.sessionId,
      responses: [],
      questions: this.questions
    };
    
    console.log('Utilisation de trainee_id pour la soumission:', submission.trainee_id);
    console.log('Questions à traiter:', this.questions);
    
    // Extraire les réponses
    this.questions.forEach(question => {
      const questionKey = `question${question.question_id}`;
      console.log(`Traitement de la question ${questionKey}:`, question);
      
      const questionFormData = formData[questionKey];
      console.log(`Données du formulaire pour ${questionKey}:`, questionFormData);
      
      if (questionFormData) {
        const response: SurveyResponse = {
          question_id: question.question_id,
          rating: questionFormData.rating
        };
        
        // Ajouter l'observation optionnelle
        if (questionFormData.observation && questionFormData.observation.trim()) {
          response.observation = questionFormData.observation.trim();
        }
        
        console.log(`Ajout de la réponse pour la question ${question.question_id}:`, response);
        submission.responses.push(response);
      } else {
        console.warn(`Aucune donnée de formulaire trouvée pour la question ${question.question_id}`);
      }
    });
    
    // Enregistrer les données de soumission finales
    console.log('Données de soumission finales:', JSON.stringify(submission, null, 2));
    
    // URL de l'API
    const apiUrl = 'https://training-backend-1pda.onrender.com/eval/trainee/pratique/submit-survey';
    console.log('Soumission à l\'API:', apiUrl);
    
    // Soumettre à l'API avec gestion détaillée des erreurs
    this.http.post(apiUrl, submission)
      .subscribe({
        next: (response) => {
          console.log('Réponse API réussie:', response);
          this.handleSuccessSubmission();
        },
        error: (error) => {
          console.error('Détails de l\'erreur API:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.handleSubmissionError(error);
        }
      });
  }

  // Reset form to initial state
  resetForm() {
    console.log('resetForm appelé');
    this.submitted = false;
    
    // Utiliser la méthode centralisée pour obtenir l'ID du stagiaire
    const traineeId = this.getCurrentTraineeId();
    console.log('Trainee ID pour reset:', traineeId);
    
    // Réinitialiser le formulaire avec l'ID du stagiaire
    this.surveyForm.reset({
      traineeId: traineeId,
      sessionId: ''
    });
    
    console.log('Formulaire après réinitialisation:', this.surveyForm.value);
    
    // Réinitialiser le formulaire avec des valeurs vides pour toutes les questions
    this.initializeForm();
  }
}