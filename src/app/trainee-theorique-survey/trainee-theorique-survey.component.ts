import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

interface SurveySubmissionWithQuestions extends SurveySubmission {
  questions?: SurveyQuestion[];
}

interface TraineeInfo {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
}

interface SurveyQuestion {
  question_id: number;
  category: string;
  title: string;
  text_en: string;
  text_ar: string;
  note_fr?: string;
  id?: number;
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

interface SurveySubmission {
  trainee_id: string;
  session_id?: string;
  responses: SurveyResponse[];
}

interface ApiResponse {
  questions?: SurveyQuestion[];
  rating_options?: { [key: string]: string };
}

@Component({
  selector: 'app-survey',
  templateUrl: './trainee-theorique-survey.component.html',
  styleUrls: ['./trainee-theorique-survey.component.css']
})
export class TraineeTheoriqueSurveyComponent implements OnInit {
  // Form related properties
  surveyForm: FormGroup;
  submitted = false;
  isSubmitting = false;
  
  // UI state
  currentLanguage: 'en' | 'ar' = 'en';
  loading = true;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  // Data
  questions: SurveyQuestion[] = [];
  
  // Rating options from backend
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
      loading: 'Loading questions...',
      noQuestions: 'No questions available.'
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
      loading: 'جاري تحميل الأسئلة...',
      noQuestions: 'لا توجد أسئلة متاحة.'
    }
  };
  
  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.surveyForm = this.formBuilder.group({
      traineeId: ['', Validators.required],
      sessionId: [''] // Made optional as backend can generate it
    });
  }
  
  ngOnInit() {
    this.loadQuestions();
    this.initializeTraineeId();
  }
  
  // Getter for easy access to form fields
  get f() { return this.surveyForm.controls; }
  
  // Initialize trainee ID from available sources
  private initializeTraineeId() {
    let traineeId = null;
    
    // Try multiple sources in order of preference
    traineeId = localStorage.getItem('candidateId') || 
                localStorage.getItem('traineeId') || 
                this.authService.getCandidateId();
    
    console.log('Initializing trainee ID:', traineeId);
    
    if (traineeId) {
      this.surveyForm.patchValue({
        traineeId: traineeId
      });
      
      // Log candidate info if available
      const candidateInfo = localStorage.getItem('candidateInfo');
      if (candidateInfo) {
        try {
          const parsedInfo = JSON.parse(candidateInfo);
          console.log('Candidate info:', parsedInfo);
        } catch (e) {
          console.error('Error parsing candidateInfo:', e);
        }
      }
    } else {
      console.error('No trainee ID found');
      this.errorMessage = 'Session expired. Please login again.';
    }
  }
  
  // Load questions from backend
  loadQuestions() {
    this.loading = true;
    this.errorMessage = null;
    
    // Updated API endpoint to match backend
    this.http.get<SurveyQuestion[]>('https://training-backend-1pda.onrender.com/eval/trainee/theorique/survey-questions')
      .subscribe({
        next: (response: any) => {
          console.log('API Response:', response);
          
          // Handle response structure from backend
          if (response.questions) {
            this.questions = response.questions;
            
            // Update rating options if provided by backend
            if (response.rating_options) {
              this.updateRatingOptions(response.rating_options);
            }
          } else if (Array.isArray(response)) {
            // Handle direct array response
            this.questions = response;
          } else {
            console.error('Unexpected response format:', response);
            this.questions = [];
          }
          
          console.log('Loaded questions:', this.questions);
          this.initializeForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading questions:', error);
          this.loading = false;
          this.errorMessage = this.uiTexts[this.currentLanguage].errorMessage;
        }
      });
  }
  
  // Update rating options from backend response
  private updateRatingOptions(backendRatingOptions: { [key: string]: string }) {
    this.ratingOptions = Object.keys(backendRatingOptions).map(key => ({
      key: key,
      text_en: this.getRatingTextEn(key),
      text_ar: backendRatingOptions[key]
    }));
  }
  
  // Get English text for rating keys
  private getRatingTextEn(key: string): string {
    const textMap: { [key: string]: string } = {
      'very_satisfied': 'Very Satisfied',
      'satisfied': 'Satisfied',
      'not_satisfied': 'Not Satisfied'
    };
    return textMap[key] || key;
  }
  
  // Initialize form with questions
  initializeForm() {
    const traineeId = localStorage.getItem('candidateId') || 
                     localStorage.getItem('traineeId') || 
                     this.authService.getCandidateId() || 
                     '';
    
    console.log('Form initialization - trainee ID:', traineeId);
    
    const formControls: { [key: string]: any } = {
      traineeId: [traineeId, Validators.required],
      sessionId: [''] // Optional - backend will generate if empty
    };

    // Add form groups for each question
    this.questions.forEach(question => {
      formControls[`question${question.question_id}`] = this.formBuilder.group({
        rating: ['', Validators.required],
        observation: [''] // Optional field
      });
    });

    this.surveyForm = this.formBuilder.group(formControls);
    
    if (!traineeId) {
      console.warn('No trainee ID found during form initialization');
      this.errorMessage = 'Trainee ID missing. Please login again.';
    }
  }
  
  // Get question form control
  getQuestionControl(questionId: number, field: string) {
    const questionGroup = this.surveyForm.get(`question${questionId}`);
    if (!questionGroup) {
      console.error(`Question group not found: question${questionId}`);
      return null;
    }
    
    return questionGroup.get(field);
  }
  
  // Change language
  changeLanguage(lang: 'en' | 'ar') {
    this.currentLanguage = lang;
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
  
  // Handle successful submission
  private handleSuccessSubmission() {
    console.log('Survey submitted successfully');
    this.isSubmitting = false;
    this.successMessage = this.uiTexts[this.currentLanguage].successMessage;
    this.errorMessage = null;
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }
  
  // Handle submission error
  private handleSubmissionError(error: any) {
    console.error('Submission error:', error);
    this.isSubmitting = false;
    this.successMessage = null;
    
    // Show specific error message if available
    if (error.error && error.error.error) {
      this.errorMessage = error.error.error;
    } else {
      this.errorMessage = this.uiTexts[this.currentLanguage].errorMessage;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Check if running in development mode
  private isDevelopmentMode(): boolean {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }
  
  // Submit survey
  onSubmit() {
    console.log('Form submission started');
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;
    
    console.log('Form value:', this.surveyForm.value);
    console.log('Form valid:', this.surveyForm.valid);
    
    // Validate form
    if (this.surveyForm.invalid) {
      console.error('Form is invalid');
      this.logFormErrors();
      return;
    }
    
    this.isSubmitting = true;
    const formData = this.surveyForm.value;
    
    // Get trainee ID with fallback options
    let traineeId = formData.traineeId;
    if (!traineeId) {
      traineeId = localStorage.getItem('candidateId') || 
                  localStorage.getItem('traineeId') || 
                  this.authService.getCandidateId();
    }
    
    if (!traineeId) {
      console.error('No valid trainee ID found');
      this.errorMessage = 'Error: Trainee ID not found. Please login again.';
      this.isSubmitting = false;
      return;
    }
    
    // Prepare submission data according to backend structure
    const submission: SurveySubmission = {
      trainee_id: traineeId,
      responses: []
    };
    
    // Add session_id if provided
    if (formData.sessionId && formData.sessionId.trim()) {
      submission.session_id = formData.sessionId.trim();
    }
    
    console.log('Processing questions:', this.questions);
    
    // Extract responses from form
    this.questions.forEach(question => {
      const questionKey = `question${question.question_id}`;
      const questionFormData = formData[questionKey];
      
      if (questionFormData && questionFormData.rating) {
        const response: SurveyResponse = {
          question_id: question.question_id,
          rating: questionFormData.rating
        };
        
        // Add observation if provided
        if (questionFormData.observation && questionFormData.observation.trim()) {
          response.observation = questionFormData.observation.trim();
        }
        
        submission.responses.push(response);
      }
    });
    
    console.log('Final submission data:', submission);
    
    // Validate that we have responses
    if (submission.responses.length === 0) {
      console.error('No responses to submit');
      this.errorMessage = 'Please answer at least one question.';
      this.isSubmitting = false;
      return;
    }
    
    // Submit to backend
    const apiUrl = 'https://training-backend-1pda.onrender.com/eval/trainee/theorique/submit-survey';
    
    this.http.post(apiUrl, submission)
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          this.handleSuccessSubmission();
        },
        error: (error) => {
          console.error('API Error:', error);
          this.handleSubmissionError(error);
        }
      });
  }
  
  // Log form validation errors
  private logFormErrors() {
    Object.keys(this.surveyForm.controls).forEach(key => {
      const control = this.surveyForm.get(key);
      if (control && control.invalid) {
        console.error(`Control ${key} is invalid:`, control.errors);
      }
    });
    
    // Check specific fields
    const traineeIdControl = this.surveyForm.get('traineeId');
    if (traineeIdControl && traineeIdControl.invalid) {
      this.errorMessage = this.uiTexts[this.currentLanguage].traineeIdRequired;
      return;
    }
    
    // Scroll to first error
    const firstInvalidElement = document.querySelector('.validation-error');
    if (firstInvalidElement) {
      firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  // Reset form
  resetForm() {
    this.submitted = false;
    this.surveyForm.reset();
    this.initializeForm();
    this.initializeTraineeId();
  }
  
  // Get current UI text

  
  // Get question text in current language
  getQuestionText(question: SurveyQuestion): string {
    return this.currentLanguage === 'ar' ? question.text_ar : question.text_en;
  }
  
  // Get rating option text in current language
  getRatingOptionText(option: RatingOption): string {
    return this.currentLanguage === 'ar' ? option.text_ar : option.text_en;
  }
}