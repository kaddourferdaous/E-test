import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
interface SurveySubmissionWithQuestions extends SurveySubmission {
  questions?: SurveyQuestion[];
}
interface CandidateInfo {
  id: string;
  nom: string;
  email: string;
}
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

interface SurveySubmission {
  trainee_id: string;

  responses: SurveyResponse[];
}

@Component({
  selector: 'app-survey',
  templateUrl: './trainee-ojt-survey.component.html',
  styleUrls: ['./trainee-ojt-survey.component.css']
})
export class TraineeOjtSurveyComponent implements OnInit {
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
      errorMessage: 'Failed to submit survey. Please try again.'
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
      errorMessage: 'فشل في إرسال الاستبيان. حاول مرة اخرى.'
    }
  };
  
  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) {
    this.surveyForm = this.formBuilder.group({
      traineeId: ['', Validators.required],
    
    });
  }
  
  ngOnInit() {
    this.loadQuestions();
  }
  
  // Getter for easy access to form fields
  get f() { return this.surveyForm.controls; }
  
  loadQuestions() {
    this.loading = true;
    
    // Try to fetch questions from API
    this.http.get<SurveyQuestion[]>('https://training-backend-1pda.onrender.com/eval/trainee/ojt/survey-questions')
      .subscribe({
        next: (data) => {
          this.questions = data;
          this.initializeForm();
          this.loading = false;
        }
      });
  }
  

  
  initializeForm() {
    // Reinitialize form
    const formControls: { [key: string]: any } = {
      traineeId: [''],
      sessionId: ['']
    };

    // Add form groups for each question
    this.questions.forEach(question => {
      formControls[`question${question.question_id}`] = this.formBuilder.group({
        rating: ['', Validators.required],
        observation: [''] // Optional field
      });
    });

    this.surveyForm = this.formBuilder.group(formControls);
  }
  
  getQuestionControl(questionId: number, field: string) {
    const questionGroup = this.surveyForm.get(`question${questionId}`);
    if (!questionGroup) {
      console.error(`Question group not found: question${questionId}`);
      return null;
    }
    
    return questionGroup.get(field);
  }
  
  changeLanguage(lang: 'en' | 'ar') {
    this.currentLanguage = lang;
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
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
  private isDevelopmentMode(): boolean {
    const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    console.log('isDevelopmentMode:', isDev);
    return isDev;
  }
  onSubmit() {
    console.log('onSubmit called');
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;
    
    console.log('Form value before validation:', this.surveyForm.value);
    console.log('Form valid status:', this.surveyForm.valid);
    
    // Validate form
    if (this.surveyForm.invalid) {
      console.error('Form is invalid', this.surveyForm.errors);
      // Log specific errors for each control
      Object.keys(this.surveyForm.controls).forEach(key => {
        const control = this.surveyForm.get(key);
        if (control && control.invalid) {
          console.error(`Control ${key} is invalid:`, control.errors);
        }
      });
      
      // Scroll to first error
      const firstInvalidElement = document.querySelector('.validation-error');
      if (firstInvalidElement) {
        firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    this.isSubmitting = true;
    const formData = this.surveyForm.value;
    console.log('Form data to be processed:', formData);
    
    // Récupérer l'ID du candidat connecté à partir de localStorage
    let traineeId = formData.traineeId;
    try {
      const storedCandidateInfo = localStorage.getItem('candidateInfo');
      console.log('Checking localStorage for candidate info:', storedCandidateInfo);
      
      if (storedCandidateInfo) {
        const candidateInfo: CandidateInfo = JSON.parse(storedCandidateInfo);
        console.log('Retrieved candidate info from localStorage:', candidateInfo);
        
        if (candidateInfo && candidateInfo.id) {
          traineeId = candidateInfo.id;
          console.log('Using candidate ID from localStorage:', traineeId);
        } else {
          console.warn('Candidate ID not found in localStorage, using form value:', traineeId);
        }
      } else {
        console.warn('No candidate info found in localStorage, using form value:', traineeId);
      }
    } catch (error) {
      console.error('Error retrieving candidate info from localStorage:', error);
      console.warn('Falling back to form value for trainee ID:', traineeId);
    }
    
    // Prepare submission data with retrieved traineeId
    const submission: SurveySubmissionWithQuestions = {
      trainee_id: traineeId,

      responses: [],
      questions: this.questions
    };
    
    console.log('Using trainee_id for submission:', submission.trainee_id);
    console.log('Questions to process:', this.questions);
    
    // Extract responses
    this.questions.forEach(question => {
      const questionKey = `question${question.question_id}`;
      console.log(`Processing question ${questionKey}:`, question);
      
      const questionFormData = formData[questionKey];
      console.log(`Form data for ${questionKey}:`, questionFormData);
      
      if (questionFormData) {
        const response: SurveyResponse = {
          question_id: question.question_id,
          rating: questionFormData.rating
        };
        
        // Add optional observation
        if (questionFormData.observation && questionFormData.observation.trim()) {
          response.observation = questionFormData.observation.trim();
        }
        
        console.log(`Adding response for question ${question.question_id}:`, response);
        submission.responses.push(response);
      } else {
        console.warn(`No form data found for question ${question.question_id}`);
      }
    });
    
    // Log the final submission data
    console.log('Final submission data:', JSON.stringify(submission, null, 2));
    
    // URL de l'API
    const apiUrl = 'https://training-backend-1pda.onrender.com/eval/trainee/ojt/submit-survey';
    console.log('Submitting to API:', apiUrl);
    
    // Submit to API with detailed error handling
    this.http.post(apiUrl, submission)
      .subscribe({
        next: (response) => {
          console.log('API Response success:', response);
          this.handleSuccessSubmission();
        },
        error: (error) => {
          console.error('API Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          this.handleSubmissionError(error);
        }
      });
  }
  
  resetForm() {
    this.submitted = false;
    this.surveyForm.reset();
    this.initializeForm(); // Re-initialize to set up validators again
  }
}