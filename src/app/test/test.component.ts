// Updates to TestComponent.ts
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Interface for questions from API
interface Question {
  _id: string;
  type: string;
  question: string;
  reponse_correcte: string | string[];
  note: number;
  options?: string[];
  model_day?: string;
}

// Interface for the local question format
interface LocalQuestion {
  text: string;
  options?: string[];
  correctAnswer?: number | number[]; 
  type: string;
}

interface FraudAttempt {
  userId: string;
  timestamp: string;
  action: string;
}

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit, OnDestroy {
setTestDay(arg0: string) {
throw new Error('Method not implemented.');
}
  currentQuestion: number = 1;
  score: number = 0;
  questions: LocalQuestion[] = [];
  totalQuestions: number = 0;
  progressWidth: string = '0%';
  candidateId: string = '';
  candidateName: string = '';
  candidateEmail: string = '';
  selectedAnswers: { [questionIndex: number]: (number | string)[] } = {};
  testFinished: boolean = false;
  selectedLanguage: string = 'ar';
  showResult = false;
  selectedDay: string = '';
  fraudAttemptDetected: boolean = false;
  private fraudAttempts: FraudAttempt[] = [];

  // Questions intégrées directement dans le composant
  private hardcodedQuestions: { [key: string]: Question[] } = {
    '1': [
      {
        "_id": "6814b2bd7aa73e530e6dc153",
        "type": "qcm",
        "question": "ماذا تعني كلمة: إخلاء؟",
        "reponse_correcte": ["الخروج من مكان العمل أثناء الخطر بنظام"],
        "note": 1,
        "model_day": "1",
        "options": [
          "الهروب والتدافع",
          "الخروج من مكان العمل أثناء الخطر بسرعة",
          "الخروج من مكان العمل أثناء الخطر بنظام"
        ]
      },
      {
        "_id": "6814be7d7aa73e530e6dc155",
        "type": "qcm",
        "question": "من هو مؤسس يازاكي؟",
        "reponse_correcte": ["صدامي يازكي"],
        "note": 1,
        "model_day": "1",
        "options": [
          "شينجي يازاكي",
          "صدامي يازكي",
          "ريوسوكي يازاكي"
        ]
      },
      {
        "_id": "6814be997aa73e530e6dc156",
        "type": "qcm",
        "question": "كم عدد المصانع الموجودة في المغرب؟",
        "reponse_correcte": ["5"],
        "note": 1,
        "model_day": "1",
        "options": [
          "5",
          "4",
          "3"
        ]
      },
      {
        "_id": "6814beaf7aa73e530e6dc157",
        "type": "qcm",
        "question": "ماهي أول مرحلة من مراحل إنتاج الكابلات من العمليات التالية؟",
        "reponse_correcte": ["Coupe / قطع"],
        "note": 1,
        "model_day": "1",
        "options": [
          "Assemblage / تجميع",
          "Coupe / قطع",
          "Expédition / شحن"
        ]
      }
    ],
    '2': [
      {
        "_id": "6814bf587aa73e530e6dc15a",
        "type": "qcm",
        "question": "ما هو أول S؟",
        "reponse_correcte": ["Seiri / الفرز"],
        "note": 1,
        "model_day": "2",
        "options": [
          "Seiton / تنظيم",
          "Seiri / الفرز",
          "Seiso / تنظيف"
        ]
      },
      {
        "_id": "6814bf767aa73e530e6dc15b",
        "type": "qcm",
        "question": "ما هي مودا النقل؟",
        "reponse_correcte": ["تنقل الأشخاص غير الضروري"],
        "note": 1,
        "options": [
          "تنقل الأشخاص غير الضروري",
          "الحركة غير الضرورية للمنتجات أو المواد",
          "الانتظار غير الضروري"
        ]
      }
    ]
  };

  constructor(
    private authService: AuthService, 
    public router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Get query parameters (day and language)
    this.route.queryParams.subscribe(params => {
      this.selectedDay = params['day'];
      if (params['language']) {
        this.selectedLanguage = params['language'];
      }
      
      console.log('Loading test for day:', this.selectedDay, 'Language:', this.selectedLanguage);
      
      // Load questions for the specific day
      this.loadCandidateInfo();
      this.loadQuestions();
    });
  }

  ngOnDestroy(): void {
    // Envoyer toutes les tentatives de fraude restantes au backend
    if (this.fraudAttempts.length > 0) {
      this.logFraudAttemptsBatch().subscribe({
        next: () => console.log('Tentatives de fraude restantes enregistrées'),
        error: (err) => console.error('Erreur lors de l\'enregistrement des tentatives restantes', err)
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
        
        console.log('Candidate information loaded from localStorage:', {
          candidateId: this.candidateId,
          candidateName: this.candidateName,
          candidateEmail: this.candidateEmail
        });
      } catch (error) {
        console.error('Error loading candidate information from localStorage:', error);
      }
    } else {
      console.log('No candidate information found in localStorage.');
      this.loadCandidateInfoFromAPI();
    }
  }

  loadCandidateInfoFromAPI(): void {
    this.authService.getCandidateInfo().subscribe(
      (data: any) => {
        console.log('Candidate information loaded from API:', data);
        this.candidateId = data.id || 'Inconnu';
        this.candidateName = data.nom || 'Inconnu';
        this.candidateEmail = data.email || 'Inconnu';

        localStorage.setItem('candidateInfo', JSON.stringify(data));
      },
      error => {
        console.error('Error loading candidate information from API:', error);
      }
    );
  }

  loadQuestions(): void {
    // Charger les questions depuis les données intégrées
    const questionsForDay = this.hardcodedQuestions[this.selectedDay];
    
    if (!questionsForDay || questionsForDay.length === 0) {
      console.log('No questions found for day:', this.selectedDay);
      return;
    }

    console.log('Questions loaded for day:', this.selectedDay, 'Count:', questionsForDay.length);
    
    // Transform the questions to the local format
    this.questions = questionsForDay.map(q => {
      if (q.type === 'qcm' && q.options && q.options.length > 0) {
        // Convert correct answer to array of indexes
        const correctAnswer = Array.isArray(q.reponse_correcte)
          ? q.reponse_correcte.map(ans => q.options!.indexOf(ans))
          : [q.options!.indexOf(q.reponse_correcte)];

        return {
          text: q.question,
          options: q.options,
          correctAnswer: correctAnswer,
          type: 'qcm'
        };
      } else {
        return {
          text: q.question,
          type: 'libre'
        };
      }
    });

    this.totalQuestions = this.questions.length;
    this.updateProgress();
  }

  nextQuestion(): void {
    if (this.currentQuestion < this.totalQuestions) {
      this.currentQuestion++;
      this.updateProgress();
    }
  }

  previousQuestion(): void {
    if (this.currentQuestion > 1) {
      this.currentQuestion--;
      this.updateProgress();
    }
  }

  updateProgress(): void {
    this.progressWidth = `${(this.currentQuestion / this.totalQuestions) * 100}%`;
  }

  selectAnswer(optionIndex: number): void {
    const questionIndex = this.currentQuestion - 1;
    if (!this.selectedAnswers[questionIndex]) {
      this.selectedAnswers[questionIndex] = [];
    }

    const index = this.selectedAnswers[questionIndex].indexOf(optionIndex);
    if (index === -1) {
      this.selectedAnswers[questionIndex].push(optionIndex);
    } else {
      this.selectedAnswers[questionIndex].splice(index, 1);
    }

    this.updateScore();
  }

  updateScore(): void {
    let newScore = 0;
    this.questions.forEach((q, index) => {
      if (q.type === 'qcm' && q.correctAnswer !== undefined) {
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        const selected = this.selectedAnswers[index] || [];
        // Filter only number type answers (QCM)
        const selectedNumbers = selected.filter(ans => typeof ans === 'number') as number[];
        if (correctAnswers.every(ans => selectedNumbers.includes(ans))) {
          newScore++;
        }
      }
    });
    this.score = newScore;
  }

  isSelected(questionIndex: number, optionIndex: number): boolean {
    const selected = this.selectedAnswers[questionIndex] || [];
    // Filter only number type answers (QCM)
    const selectedNumbers = selected.filter(ans => typeof ans === 'number') as number[];
    return selectedNumbers.includes(optionIndex);
  }

  saveFreeResponse(event: Event): void {
    const input = event.target as HTMLInputElement;
    const questionIndex = this.currentQuestion - 1;
    this.selectedAnswers[questionIndex] = [input.value];
  }

  prepareAndSaveResponses(): void {
    if (this.testFinished) {
      console.log("The test is already finished. Responses have already been saved.");
      return;
    }
  
    if (!this.candidateId) {
      console.error("Candidate ID missing!");
      return;
    }
  
    const responses: { question: string; answer: string | string[]; correct: boolean }[] = [];
    let correctCount = 0;
  
    this.questions.forEach((q, index) => {
      const userAnswer = this.selectedAnswers[index] || [];
      let isCorrect = false;
  
      const formattedAnswer = userAnswer.map(ans => {
        if (typeof ans === 'number' && q.options) {
          return q.options[ans];
        } else {
          return ans.toString();
        }
      });
  
      if (Array.isArray(q.correctAnswer)) {
        const correctAnswers = q.correctAnswer.map(ans => q.options![ans]);
        if (correctAnswers.sort().toString() === formattedAnswer.sort().toString()) {
          isCorrect = true;
          correctCount++;
        }
      } else if (q.correctAnswer !== undefined) {
        const correctAnswer = q.options![q.correctAnswer as number];
        if (correctAnswer === formattedAnswer[0]) {
          isCorrect = true;
          correctCount++;
        }
      }
  
      responses.push({
        question: q.text,
        answer: formattedAnswer,
        correct: isCorrect
      });
    });
  
    // Calcul du pourcentage
    const percentage = this.questions.length > 0 
      ? Math.round((correctCount / this.questions.length) * 100) 
      : 0;
  
    const dataToSend = {
      candidate: {
        id: this.candidateId,
        name: this.candidateName,
        email: this.candidateEmail
      },
      responses: responses,
      date: new Date().toISOString(),
      score: this.score,
      percentage: percentage,
      day: this.selectedDay,
      fraudAttempts: this.fraudAttempts // Inclure les tentatives de fraude
    };
  
    console.log("Data to send to backend:", dataToSend);
  
    this.authService.saveResponses(dataToSend).subscribe(
      response => {
        console.log("Responses successfully saved:", response);
        this.testFinished = true;
        this.showResult = true;
      },
      error => {
        console.error("Error saving responses:", error);
      }
    );
  }
  
  changeLanguage(language: string): void {
    this.selectedLanguage = language;
    this.loadQuestions();
  }

  // Détecter les touches de capture d'écran
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    console.log('Événement clavier détecté:', {
      key: event.key,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey
    });

    const isPrintScreen = event.key === 'PrintScreen' || event.key === 'Snapshot';
    const isMacScreenshot = event.metaKey && event.shiftKey && (event.key === '3' || event.key === '4');
    const isAltPrintScreen = event.altKey && event.key === 'PrintScreen';
    const isCopyAction = (event.ctrlKey || event.metaKey) && event.key === 'c';

    if (isPrintScreen || isMacScreenshot || isAltPrintScreen || isCopyAction) {
      const action = isCopyAction ? 'Tentative de copie de texte' : 'Tentative de capture d\'écran';
      this.detectFraudAttempt(action, `Touche détectée: ${event.key}, Meta: ${event.metaKey}, Shift: ${event.shiftKey}, Alt: ${event.altKey}`);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // Détecter les pertes de focus (peut indiquer une capture d'écran ou un changement d'application)
  @HostListener('window:blur', ['$event'])
  handleWindowBlur(): void {
    console.log('Perte de focus détectée');
    this.detectFraudAttempt('Perte de focus', 'L\'utilisateur a quitté la fenêtre du quiz');
  }

  // Détecter les tentatives de copie de texte
  @HostListener('document:copy', ['$event'])
  handleCopyEvent(event: ClipboardEvent): void {
    console.log('Événement de copie détecté');
    this.detectFraudAttempt('Copie de texte', 'L\'utilisateur a tenté de copier du contenu');
    event.preventDefault();
  }

  // Enregistrer une tentative de fraude
  detectFraudAttempt(action: string, details: string): void {
    this.fraudAttemptDetected = true;
    const fraudAttempt: FraudAttempt = {
      timestamp: new Date().toISOString(),
      action,
      userId: this.candidateId || 'Unknown'
    };

    this.fraudAttempts.push(fraudAttempt);
    console.log('Tentative de fraude enregistrée localement:', fraudAttempt);

    // Afficher une alerte à l'utilisateur
    alert(`⚠️ ${action} détectée ! Cette action est interdite et a été enregistrée.`);

    // Envoyer immédiatement au backend
    this.logFraudAttempt(fraudAttempt).subscribe({
      next: () => console.log('Tentative de fraude envoyée au backend'),
      error: (err) => console.error('Erreur lors de l\'envoi de la tentative de fraude', err)
    });
  }

  // Envoyer une tentative de fraude au backend
  logFraudAttempt(fraudAttempt: FraudAttempt): Observable<any> {
    const apiUrl = '/api/fraud-attempts';
    return this.http.post(apiUrl, fraudAttempt);
  }

  // Envoyer toutes les tentatives de fraude en lot
  logFraudAttemptsBatch(): Observable<any> {
    const apiUrl = '/api/fraud-attempts/batch';
    return this.http.post(apiUrl, this.fraudAttempts);
  }
}