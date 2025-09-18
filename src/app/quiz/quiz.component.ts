import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../auth.service';

// Type pour représenter un objet indexable par des chaînes de caractères
interface UserOrder {
  [key: string]: number; // Les clés sont des chaînes de caractères, les valeurs sont des nombres
}
interface QuestionSubmission {
  question_id: any;
  type: string;
  answers: any[];
  score: number;
  possible_score: number;
}
interface SynonymGroup {
  mainWord: string;
  synonyms: string[];
}

// Interface pour le résultat de traitement d'une question
interface QuestionResult {
  score: number;
  possibleScore: number;
  unanswered: number;
  submission: QuestionSubmission | null;
}
interface KeywordVariants {
  [keyword: string]: string[];
}
interface LanguageDictionary {
  language: string;
  name: string;
  dictionary: string[];
  synonymGroups: SynonymGroup[];
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  questions: any[] = []; // Liste des questions récupérées depuis l'API
  userOrder: { [questionId: string]: UserOrder } = {}; // Stocke les réponses de l'utilisateur pour les questions d'ordre
  userAnswers: { [key: string]: any } = {}; // Stocke les réponses générales (QCM, vrai/faux, etc.)
matchingAnswers: {
  [questionId: string]: {
    [gaucheId: string]: string[];
  };
} = {};
  quizForm!: FormGroup;
  libreAnswers: { [key: string]: string } = {}; // Pour stocker les réponses aux questions libres
  blankAnswers: any = {};
    multiTrueFalseAnswers: { [key: string]: { [key: number]: boolean | null } } = {};
  matchingInputs: { [key: string]: string } = {}; // Pour stocker les réponses de l'utilisateur pour les questions d'appariement
  spellCheckerEnabled: boolean = true; // Option pour activer/désactiver le correcteur orthographique
question: any;
candidateId: string = ''; // ID du candidat
candidateName: string = ''; // Nom du candidat
candidateEmail: string = ''; // Email du candidat
readonly LICENCE_QUESTION_ID = '6808b37d120a92c815b878c9'; // Remplacez avec l'ID réel
startTime: Date | null = null;
  currentTime: Date = new Date();
  elapsedTime: string = '00:00:00';
  timerInterval: any;
  isTimerRunning: boolean = false;
  quizDuration: number = 0; // Durée en secondes
    private apiUrl = 'https://training-backend-1pda.onrender.com';

  constructor(private http: HttpClient, private fb: FormBuilder,private authService:AuthService) {}

  ngOnInit(): void {
    console.log('Quiz component initialized');
    this.quizForm = this.fb.group({});
    this.fetchAllQuestions();
    this.loadCandidateInfo();
      this.startTimer();
  }
  startTimer(): void {
    if (this.isTimerRunning) {
      console.log('Le chronomètre est déjà en cours');
      return;
    }

    this.startTime = new Date();
    this.isTimerRunning = true;
    
    console.log('Chronomètre démarré à:', this.startTime.toLocaleTimeString());

    // Mettre à jour le chronomètre toutes les secondes
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  // Méthode pour mettre à jour le chronomètre
  updateTimer(): void {
    if (!this.startTime) return;

    this.currentTime = new Date();
    const elapsed = this.currentTime.getTime() - this.startTime.getTime();
    this.quizDuration = Math.floor(elapsed / 1000); // Durée en secondes
    
    // Convertir en format HH:MM:SS
    this.elapsedTime = this.formatTime(elapsed);
  }

  // Méthode pour formater le temps en HH:MM:SS
  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
  }

  // Méthode utilitaire pour ajouter un zéro devant les nombres < 10
  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  // Méthode pour arrêter le chronomètre
  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isTimerRunning = false;
    console.log('Chronomètre arrêté. Durée totale:', this.elapsedTime);
  }

  // Méthode pour remettre à zéro le chronomètre
  resetTimer(): void {
    this.stopTimer();
    this.startTime = null;
    this.elapsedTime = '00:00:00';
    this.quizDuration = 0;
    console.log('Chronomètre remis à zéro');
  }

  // Méthode pour obtenir la durée en format lisible
  getFormattedDuration(): string {
    return this.elapsedTime;
  }

  // Méthode pour obtenir la durée en secondes
  getDurationInSeconds(): number {
    return this.quizDuration;
  }

  isLicenceQuestion(question: any): boolean {
    return question.id === this.LICENCE_QUESTION_ID;
  }
  
  loadCandidateInfo(): void {
    const candidateInfo = localStorage.getItem('candidateInfo');
      
    if (candidateInfo) {
      try {
        // Parse les informations stockées dans localStorage
        const candidate = JSON.parse(candidateInfo);
          
        // Vérifie si les informations du candidat sont disponibles
        this.candidateId = candidate.id || 'Inconnu';
        this.candidateName = candidate.nom || 'Inconnu';
        this.candidateEmail = candidate.email || 'Inconnu';
          
        console.log('Informations du candidat chargées depuis localStorage:', {
          candidateId: this.candidateId,
          candidateName: this.candidateName,
          candidateEmail: this.candidateEmail
        });
      } catch (error) {
        console.error('Erreur lors du chargement des informations du candidat depuis localStorage:', error);
      }
    } else {
      console.log('Aucune information de candidat trouvée dans localStorage.');
      this.loadCandidateInfoFromAPI(); // Récupérer les informations via l'API
    }
  }
  loadCandidateInfoFromAPI(): void {
    this.authService.getCandidateInfo().subscribe(
      (data: any) => {
        console.log('Informations du candidat chargées depuis l\'API:', data);
        this.candidateId = data.id || 'Inconnu';
        this.candidateName = data.nom || 'Inconnu';
        this.candidateEmail = data.email || 'Inconnu';

        // Stocker les informations dans localStorage pour une utilisation future
        localStorage.setItem('candidateInfo', JSON.stringify(data));
      },
      error => {
        console.error('Erreur lors du chargement des informations du candidat depuis l\'API:', error);
      }
    );
  }

  // Méthode pour récupérer toutes les questions depuis l'API Flask
  fetchAllQuestions(): void {
    // Initialisation des structures de données
    this.userAnswers = {};
    this.libreAnswers = {};
    this.userOrder = {};
    this.matchingAnswers = {};
    this.blankAnswers = {};
    this.multiTrueFalseAnswers = {};

    // Chargement des questions
    this.questions = [
      {
        "_id": { "$oid": "68074e4dd45fbb3f2b582bb4" },
        "type": "QCM",
        "texte": "من هو مؤسس يازاكي ",
        "reponses": [
          { "texte_reponse": "شينجي يازاكي", "est_correcte": false },
          { "texte_reponse": "صدامي يازاكي", "est_correcte": true },
          { "texte_reponse": "ريوسوكي يازاكي", "est_correcte": false }
        ]
      },
      {
        "_id": { "$oid": "6807636dd45fbb3f2b582bb7" },
        "type": "ordonner",
        "texte": " رتب مسار مراحل إنتاج الكابلات من العمليات التالية ",
        "etapes": [
          { "texte_etape": "شحن (Expédition)", "ordre": 6 },
          { "texte_etape": "العقص (Sertissage)", "ordre": 4 },
          { "texte_etape": "مخزن (Magasin)", "ordre": 1 },
          { "texte_etape": "قطع (Coupe)", "ordre": 2 },
          { "texte_etape": "تجريد (Dénudage)", "ordre": 3 },
          { "texte_etape": "تجميع (Assemblage)", "ordre": 5 }
        ]
      },
      {
        "_id": { "$oid": "68076b01119242437fda1376" },
        "type": "appariement",
        "texte": "اكتب رقم القيمة في الخانة المناسبة ",
        "options_gauche": [
          { "id": 1, "texte": "المثابرة" },
          { "id": 2, "texte": "خدمة الاخر" },
          { "id": 3, "texte": "بعد النظر" }
        ],
        "options_droite": [
          { "id": 1, "texte": "الطموح" },
          { "id": 2, "texte": "الصمود" },
          { "id": 3, "texte": "الشغف" },
          { "id": 4, "texte": "الشجاعة" },
          { "id": 5, "texte": "العمل الجماعي" },
          { "id": 6, "texte": "حب الاستكشاف" }
        ],
        "correspondances": [
          { "gauche_id": 1, "droite_id": [2, 4] },
          { "gauche_id": 2, "droite_id": [3, 5] },
          { "gauche_id": 3, "droite_id": [1, 6] }
        ]
      },
      {
        "_id": { "$oid": "6807a7b6120a92c815b878c8" },
        "type": "espaces_vides",
        "texte": "حدد مراحل نظام الترخيص (التدريب) التي يمر من خلالها كل مستخدم جديد ؟",
        "espaces": [
          { "position": 1, "reponses_attendues": ["نظرية", "théorique", "theory", "theoretical", "conceptuelle", "analytique"] },
          { "position": 2, "reponses_attendues": ["تďيقية", "pratique", "practical", "hands-on", "appliquée", "opérationnelle"] },
          { "position": 3, "reponses_attendues": ["ojt", "on the job training", "formation sur le tas", "apprentissage pratique", "stage", "immersion professionnelle"] }
        ]
      },
      {
        "_id": { "$oid": "6808b37d120a92c815b878c9" },
        "type": "appariement",
        "texte": " بعد أي فترة نحصل على رخصة التدريب؟ ضع الرقم الجواب الصحيح في الخانة المناسبة",
        "options_gauche": [
          { "id": 1, "texte": "الرخصة التشغيلية opérationnel" },
          { "id": 2, "texte": "الرخصة المؤقتة Temporaire" }
        ],
        "options_droite": [
          { "id": 1, "texte": "بعد انتهاء الفترة النظرية" },
          { "id": 2, "texte": "بعد انتهاء فترة التطبيقي" },
          { "id": 3, "texte": "بعد انتهاء فترة ojt" }
        ],
        "correspondances": [
          { "gauche_id": 1, "droite_id": [3] },
          { "gauche_id": 2, "droite_id": [2] }
        ]
      },
      {
        "_id": { "$oid": "6808fcf2b93a21afcc06ea87" },
        "type": "multi_vrai_faux",
        "texte": " ضع علامة صح (ص) أو خطأ (خ) اعتمادًا على صحة الجمل التالية.",
        "options": [
          { "texte_option": "عدد أنواع الموصلات (Connecteur) هو ثلاثة.", "est_correcte": true },
          { "texte_option": "يتم استخدام الأنبوب (Tube) في حزمة الأسلاك كدورجمالي.", "est_correcte": false },
          { "texte_option": "bouchon: يمنع دخول الماء وجميع الشوائب داخل الأسلاك الكهربائية ويحمي Terminal من التآكل.", "est_correcte": true },
          { "texte_option": "Sertissage: هوعملية ربط Terminal بأطراف السلك المجردة من العازل.", "est_correcte": true },
          { "texte_option": "Test Electrique: يتحقق من وجود وموضع المكونات الغير الكهربائية فقط.", "est_correcte": false },
          { "texte_option": "Emballage: لف المنتوج النهائي وتغليفه وفقا للطريقة التي يحددها الزبون.", "est_correcte": true }
        ]
      },
      {
        "_id": { "$oid": "680b75d75859178e5f4f1b59" },
        "type": "QCM",
        "texte": "ضع علامة (X) أمام العمليات التجارية المتنوعة لمجموعة يازاكي",
        "reponses": [
          { "texte_reponse": "الأسلاك والكابلات الكهربائية", "est_correcte": true },
          { "texte_reponse": "معدات الغاز", "est_correcte": true },
          { "texte_reponse": "أجزاء المحرك", "est_correcte": false },
          { "texte_reponse": "أنظمة تكييف الهواء", "est_correcte": true },
          { "texte_reponse": "أنظمة التدفئة بالطاقة الشمسية", "est_correcte": true },
          { "texte_reponse": "مقاعد السيارة", "est_correcte": false },
          { "texte_reponse": "أنظمة السلامة والخدمة داخل المركبات", "est_correcte": true },
          { "texte_reponse": "إطارات السيارة", "est_correcte": false }
        ]
      },
      {
        "_id": { "$oid": "680b77cd5e7bc9d6aefa73eb" },
        "type": "multi_vrai_faux",
        "texte": " ضع علامة صح (ص) أو خطأ (خ) اعتمادًا على صحة الجمل التالية.",
        "options": [
          { "texte_option": "مصطلح \"جيمبا\" أصله من اللغة الألمانية", "est_correcte": false },
          { "texte_option": "مصطلح \"جيمبا\" هي المنطقة التي يتم العمل فيها", "est_correcte": true },
          { "texte_option": "يمكن تخزين زجاجات المياه على المعدات أو الآلات ، وليس على الأرض.", "est_correcte": false },
          { "texte_option": "يسمح إرتداء الأوشحة والقبعات والمجوهرات", "est_correcte": false },
          { "texte_option": "لا يسمح الساعات، الخواتم، المجوهرات والإكسسوارات.", "est_correcte": true },
          { "texte_option": "لا يُسمح بإجراء مكالمات هاتفية شخصية في مكان العمل.", "est_correcte": true }
        ]
      },
      {
        "_id": { "$oid": "680b7da8db1bf1e58f3e7c27" },
        "type": "QCM",
        "texte": " أي مما يلي لا يعتبر عملية خاصة \"processus spécial\" ؟ ضع علامة \"x\".",
        "reponses": [
          { "texte_reponse": "Sertissage العقص", "est_correcte": false },
          { "texte_reponse": "\"Épissure (soudage)\" ب) لحام", "est_correcte": false },
          { "texte_reponse": "Étanchéité نفاذية", "est_correcte": false },
          { "texte_reponse": "Soudure اللحام", "est_correcte": false },
          { "texte_reponse": "\"Clip Checker\" مقطع فاحص", "est_correcte": true },
          { "texte_reponse": "\"Visseuse\" مفك البراغي", "est_correcte": false },
          { "texte_reponse": "Préparation Shield wire إعداد الأسلاك الواقية", "est_correcte": true }
        ]
      },
      {
        "_id": { "$oid": "680ccee55e7bc9d6aefa73f2" },
        "type": "QCM",
        "texte": "أي مما يلي ليس نوع من أنواع مودا Muda",
        "reponses": [
          { "texte_reponse": "المهام الزائدة over-processing", "est_correcte": false },
          { "texte_reponse": "الحركة Mouvement", "est_correcte": false },
          { "texte_reponse": "الإفراط في المخزون inventaire", "est_correcte": false },
          { "texte_reponse": "مراقبة Controle", "est_correcte": true }
        ]
      },
      {
        "_id": { "$oid": "680d4b75216eb3d923cedbe4" },
        "type": "QCM",
        "texte": " أي من الجمل الآتية يعتبر تعريف للعيب \"défaut\"؟ ضع علامة \"x\".",
        "reponses": [
          { "texte_reponse": " أي منتج يلبي مواصفات الزبون من حيث الأبعاد والمرئيات ولا يتوافق مع معايير يازاكي", "est_correcte": false },
          { "texte_reponse": " أي منتج لا يلبي مواصفات الزبون من حيث الأبعاد والمرئيات ولكنه يتوافق مع معايير يازاكي", "est_correcte": false },
          { "texte_reponse": " أي منتج لا يلبي مواصفات الزبون من حيث الأبعاد والمرئيات ، أو لا يتوافق مع معايير يازاكي", "est_correcte": true }
        ]
      },
      {
        "_id": { "$oid": "680d4bcb216eb3d923cedbe5" },
        "type": "QCM",
        "texte": " ما هي الخطوات الصحيحة لإبلاغ عن العيب \"défaut\"؟ ضع علامة \"x\".",
        "reponses": [
          { "texte_reponse": "الاستمرار في العمل وأبلغ المدير المباشر \"chef de ligne\"", "est_correcte": false },
          { "texte_reponse": "التوقف عن العمل وإبلاغ المدير المباشر \"chef de ligne\"", "est_correcte": true },
          { "texte_reponse": "الاستمرار في العمل وفصل العيب", "est_correcte": false },
          { "texte_reponse": "التوقف عن العمل وتبليغ مدير القطاع \"chef de secteur\"", "est_correcte": false }
        ]
      },
      {
        "_id": { "$oid": "680d4ca6216eb3d923cedbe7" },
        "type": "VRAI_FAUX",
        "texte": " ضع علامة صح (ص) أو خطأ (خ) اعتمادًا على صحة الجمل التالية.",
        "reponses": [
          { "texte_reponse": "لن يؤثر عمل المشغلين على المنتج النهائي لأن لدينا فحص الجودة.", "est_correcte": false },
          { "texte_reponse": "أي مشكلة تنشأ يجب أن تتم مناقشتها وحلها مع المشغلين في مكان العمل قبل وبعد العمل", "est_correcte": true }
        ]
      },
      {
        "_id": { "$oid": "6810d6e23aa69aaa16c44127" },
        "type": "libre",
        "texte": "كم عدد مصانع يازاكي بالمغرب",
        "mots_cles": ["5", "خمس", "خمسة", "cinq", "five"],
        "score_max": 1
      },
      {
        "_id": { "$oid": "681479ffe45e0c53ef87ec33" },
        "type": "APPARIEMENT",
        "texte": "ما هو لون الزي الرسمي لكل موظف",
        "options_gauche": [
          { "id": "1", "texte": "العامل Opérateur" },
          { "id": "2", "texte": "رئيس خط الإنتاج Chef de ligne" },
          { "id": "3", "texte": "مفتش الجودة Agent de qualité" },
          { "id": "4", "texte": "تقني الصيانة Maintenance" },
          { "id": "5", "texte": "الموزع Distributeur" },
          { "id": "6", "texte": "مساعد متعدد المهام Polyvalent" }
        ],
        "options_droite": [
          { "id": "1", "texte": "أصفر" },
          { "id": "2", "texte": "أحمر غامق" },
          { "id": "3", "texte": "أخضر" },
          { "id": "4", "texte": "رمادي" },
          { "id": "5", "texte": "أزرق داكن" },
          { "id": "6", "texte": "أزرق فاتح" }
        ],
        "correspondances": [
          { "gauche_id": "1", "droite_id": "6" },
          { "gauche_id": "2", "droite_id": "2" },
          { "gauche_id": "3", "droite_id": "3" },
          { "gauche_id": "4", "droite_id": "4" },
          { "gauche_id": "5", "droite_id": "5" },
          { "gauche_id": "6", "droite_id": "1" }
        ]
      },
 {
  "_id": { "$oid": "68147b22e45e0c53ef87ec34" },
  "type": "APPARIEMENT",
  "texte": "املاء الفراغ بالكلمة الصحيحة باللغة المحلية",
  "options_gauche": [
    { "id": 1, "texte": "Seiso (Nettoyer)" },

    { "id": 2, "texte": "Seiri (Trier)" },
    
    { "id": 3, "texte": "Seiketsu (Standardiser)" },
        { "id": 4, "texte": "Seiton (Organiser)" },
            { "id": 5, "texte": "Sitsuke (Maintenir)" }

  ],
  "options_droite": [
    { "id": 4, "texte": "تنظيم" },
    { "id": 2, "texte": "فرز" },
    { "id": 3, "texte": "توحيد" },
    { "id": 1, "texte": "تنظيف" },
    { "id": 5, "texte": "استمرارية" }
  ],
  "correspondances": [
    { "gauche_id": 1, "droite_id": 4 },
    { "gauche_id": 2, "droite_id": 2 },
    { "gauche_id": 3, "droite_id": 3 },
    { "gauche_id": 4, "droite_id": 1 },
    { "gauche_id": 5, "droite_id": 5 }
  ]
},
      {
        "_id": { "$oid": "68149bbf3472380c811fed97" },
        "type": "QCM",
        "texte": "أي الجمل التالية تحدد حزمة الأسلاك \"câble\"؟ ضع علامة  \"x\".",
        "reponses": [
          { "texte_reponse": "أ) هو مجموعة من الأشرطة اللاصقة والمكونات الإضافية، على شكل جذع، بغرض توزيع المعلومات والطاقة الكهربائية على الأجزاء الوظيفية للسيارة.", "est_correcte": false },
          { "texte_reponse": "ب) هو مجموعة من الاسلاك الكهربائية، والمكونات الإضافية، على شكل جذع، والتي تهدف إلى توزيع المعلومات والطاقة الكهربائية على الأجزاء الوظيفية للسيارة.", "est_correcte": true },
          { "texte_reponse": "ج) هو مجموعة من الموصلات، والمكونات الإضافية، على شكل جدع، الغرض منها توزيع المعلومات والطاقة الكهربائية على الأجزاء الوظيفية للسيارة.", "est_correcte": false }
        ]
      },
      {
        "_id": { "$oid": "674a0a4e45e0c53ef87ec38" },
        "type": "APPARIEMENT",
        "texte": "املاء الفراغ بالكلمة الصحيحة باللغة المحلية",
        "options_gauche": [
          { "id": 1, "texte": "عبارة عن قطع معدنية عند طرفي السلك الكهربائي" },
          { "id": 2, "texte": "عبارة عن مكون بلاستيكي يستخدم لتجميع الأسلاك الكهربائة لإجراء التوصيل الكهربائي" },
          { "id": 3, "texte": "لحماية الأسلاك ، وتثبيت الأنابيب الواقية وإعطاء شكل لحزام الأسلاك." },
          { "id": 4, "texte": "هو المكون الرئيسي للكابل ويستخدم لنقل التيار الكهربائي من نقطة إلى أخرى بأقل قدر من الخسارة." },
          { "id": 5, "texte": "يمنع دخول الماء وجميع الشوائب داخل الأسلاك الكهربائية ويحمي 'الترمنال' من التآكل" }
        ],
        "options_droite": [
          { "id": 1, "texte": "Fil" },
          { "id": 2, "texte": "Terminal" },
          { "id": 3, "texte": "Bouchon" },
          { "id": 4, "texte": "Ruban" },
          { "id": 5, "texte": "Connecteur" }
        ],
        "correspondances": [
          { "gauche_id": 1, "droite_id": 2 },
          { "gauche_id": 2, "droite_id": 5 },
          { "gauche_id": 3, "droite_id": 4 },
          { "gauche_id": 4, "droite_id": 1 },
          { "gauche_id": 5, "droite_id": 3 }
        ]
      },
      {
        "_id": { "$oid": "6814a1f13472380c811fedb0" },
        "type": "QCM",
        "texte": "اختر الجواب الصحيح في عملية الإدراج (Insertion). ضع علامة  \"x\".",
        "reponses": [
          { "texte_reponse": "أ) Pull ==> Click ==> Push ==> Push", "est_correcte": false },
          { "texte_reponse": "ب) Click ==> Pull ==> Pull ==> Push", "est_correcte": false },
          { "texte_reponse": "ج) Pull ==> Click ==> Push ==> Pull", "est_correcte": false },
          { "texte_reponse": "د) Push ==> Click ==> Pull ==> Pull", "est_correcte": true },
          { "texte_reponse": "هـ) Pull ==> Pull ==> Click ==> Push", "est_correcte": false },
          { "texte_reponse": "و) Pull ==> Pull ==> Push ==> Click", "est_correcte": false }
        ]
      },
      {
  "_id": { "$oid": "6814a852e45e0c53ef87ec39" },
  "id": "6814a7103472380c811fedc3",
  "type": "APPARIEMENT",
  "texte": "املاء الفراغ بالألوان المناسبة للاختصارالإنجليزي.",
  "options_gauche": [
    { "id": 1, "texte": "Br/G" },
    { "id": 2, "texte": "W/Bl" },
    { "id": 3, "texte": "R/Y" },
    { "id": 4, "texte": "Bk/O" },
    { "id": 5, "texte": "P/G" }
  ],
  "options_droite": [

    { "id": 1, "texte": "وردي رمادي" },
        { "id": 2, "texte": "بني أخضر" },
            { "id": 3, "texte": "أبيض أزرق" },
               { "id": 4, "texte": "أحمر أصفر" },
    { "id": 5, "texte": "أسود برتقالي" }

 
  ],
  "correspondances": [
    { "gauche_id": 1, "droite_id": 2},
    { "gauche_id": 2, "droite_id": 3 },
    { "gauche_id": 3, "droite_id": 4 },
    { "gauche_id": 4, "droite_id":  5},
    { "gauche_id": 5, "droite_id": 1 }
  ]
}
    ];

    console.log('Toutes les questions chargées:', this.questions);

    // Initialisation des réponses pour chaque question
    this.questions.forEach((question) => {
      const questionId = question._id?.$oid || question.id || '';
      if (!questionId) {
        console.error('ID de question manquant', question);
        return;
      }

      // Initialisation selon le type de question
      switch (question.type.toUpperCase()) {
        case 'QCM':
          this.userAnswers[questionId] = [];
          break;

        case 'LIBRE':
          this.libreAnswers[questionId] = '';
          break;

        case 'ORDONNER':
          this.userOrder[questionId] = {};
          question.etapes.forEach((etape: any) => {
            this.userOrder[questionId][etape.texte_etape] ;
          });
          break;

        case 'APPARIEMENT':
          this.matchingAnswers[questionId] = {};
          question.options_gauche.forEach((gauche: any) => {
            const correspondance = question.correspondances.find((c: any) => c.gauche_id === gauche.id);
            const inputCount = correspondance ? (Array.isArray(correspondance.droite_id) ? correspondance.droite_id.length : 1) : 1;
            this.matchingAnswers[questionId][gauche.id] = new Array(inputCount).fill('');
          });
          break;

        case 'ESPACES_VIDES':
          question.espaces.forEach((espace: any) => {
            this.blankAnswers[`${questionId}_${espace.position}`] = '';
          });
          break;

        case 'MULTI_VRAI_FAUX':
        case 'VRAI_FAUX':
          this.multiTrueFalseAnswers[questionId] = {};
          question.options = question.options || question.reponses || [];
          question.options.forEach((opt: any, index: number) => {
            this.multiTrueFalseAnswers[questionId][index] = null;
          });
          break;

        default:
          console.warn(`Type de question non reconnu: ${question.type}`);
          break;
      }
    });
  }
isAnswerSelectedByIndex(question: any, index: number): boolean {
    const questionId = question._id?.$oid || question.id;
    return this.userAnswers[questionId]?.includes(index) || false;
  }

  toggleAnswerByIndex(question: any, index: number, event: any) {
    const questionId = question._id?.$oid || question.id;
    if (!this.userAnswers[questionId]) {
      this.userAnswers[questionId] = [];
    }
    const isChecked = event.target.checked;
    if (isChecked) {
      if (!this.userAnswers[questionId].includes(index)) {
        this.userAnswers[questionId].push(index);
      }
    } else {
      this.userAnswers[questionId] = this.userAnswers[questionId].filter((i: number) => i !== index);
    }
    console.log(`Réponses pour ${questionId}:`, this.userAnswers[questionId]);
  }



validateOrder(question: any): void {
  if (!question || !question.etapes) {
    alert('Erreur : Les étapes de la question ne sont pas disponibles.');
    return;
  }
  
  const questionId = question._id || question.id;
  
  // S'assurer que userOrder[questionId] existe
  if (!this.userOrder[questionId]) {
    this.userOrder[questionId] = {};
  }
  
  // Compter combien d'étapes ont une position assignée valide
  let validPositionsCount = 0;
  let invalidPositionsCount = 0;
  
  question.etapes.forEach((etape: any) => {
    const position = this.userOrder[questionId][etape.texte_etape];
    if (position !== undefined && position > 0) {
      validPositionsCount++;
    } else if (position === 0) {
      invalidPositionsCount++;
    }
  });
  
  // Vérifier si l'utilisateur a spécifié toutes les positions
  if (validPositionsCount < question.etapes.length) {
    alert(`Veuillez attribuer un ordre valide (supérieur à 0) à toutes les étapes avant de valider.`);
    return;
  }
  
  // Créer un dictionnaire des positions correctes selon la base de données
  const correctOrderMap: { [etapeTexte: string]: number } = {};
  question.etapes.forEach((etape: any) => {
    correctOrderMap[etape.texte_etape] = etape.ordre;
  });
  
  // Calculer le score pour donner un feedback
  let score = 0;
  let correctPositionsCount = 0;
  
  question.etapes.forEach((etape: any) => {
    const etapeTexte = etape.texte_etape;
    const userPosition = this.userOrder[questionId][etapeTexte];
    // Utiliser l'attribut 'ordre' de l'étape comme position correcte
    const correctPosition = etape.ordre;
    
    if (userPosition === correctPosition) {
      // Position exacte
      score += 1;
      correctPositionsCount++;
    } else {
      // Position incorrecte = score partiel
      const distance = Math.abs(userPosition - correctPosition);
      const maxDistance = question.etapes.length - 1;
      const proximityScore = 1 - (distance / maxDistance) * 0.75;
      
      score += proximityScore;
    }
  });
  
  // Arrondir le score à une décimale
  score = Math.round(score * 10) / 10;
  
  // Donner un feedback détaillé à l'utilisateur
  if (correctPositionsCount === question.etapes.length) {
    alert(`Parfait ! Toutes les étapes sont dans le bon ordre. Score: ${score}/${question.etapes.length}`);
  } else if (correctPositionsCount > 0) {
    alert(`${correctPositionsCount} étape(s) sur ${question.etapes.length} sont correctement placées. 
    Les autres positions sont partiellement correctes. 
    Score actuel: ${score}/${question.etapes.length}`);
  } else {
    alert(`Aucune étape n'est à la bonne position. 
    Essayez de repenser l'ordre logique des opérations. 
    Score actuel: ${score}/${question.etapes.length}`);
  }
  
  console.log('Validation de l\'ordre:', {
    questionId, 
    userOrder: this.userOrder[questionId],
    correctOrderMap: correctOrderMap,
    score,
    maxScore: question.etapes.length,
    correctCount: correctPositionsCount
  });
}
  // Méthode pour mettre à jour les réponses d'ordre
  updateOrderAnswer(questionId: string, etapeText: string, event: any): void {
    const value = parseInt(event.target.value, 10);
    
    // Initialiser l'objet pour ce questionId s'il n'existe pas
    if (!this.userOrder[questionId]) {
      this.userOrder[questionId] = {};
    }
    
    if (isNaN(value) || value <= 0) {
      // Si la valeur n'est pas un nombre valide ou est inférieure ou égale à 0,
      // considérer comme non répondue
      if (this.userOrder[questionId][etapeText] !== undefined) {
        // Si l'étape avait déjà une valeur, la supprimer
        delete this.userOrder[questionId][etapeText];
        console.log(`Suppression de l'ordre pour ${etapeText}`);
      }
      
      // Réinitialiser la valeur de l'input à vide
      event.target.value = '';
      return;
    }
    
    // Vérifier si cette valeur est déjà attribuée à une autre étape
    const etapeWithSameValue = Object.keys(this.userOrder[questionId]).find(
      key => this.userOrder[questionId][key] === value && key !== etapeText
    );
    
    // Si cette valeur est déjà attribuée à une autre étape, échanger les valeurs
    if (etapeWithSameValue) {
      const previousValue = this.userOrder[questionId][etapeText];
      
      // Mettre à jour visuellement les inputs
      const inputElements = document.querySelectorAll('.order-input');
      inputElements.forEach((input: any) => {
        if (input !== event.target && parseInt(input.value, 10) === value) {
          if (previousValue) {
            // Si l'étape actuelle avait déjà une valeur, l'attribuer à l'autre étape
            input.value = previousValue.toString();
            this.userOrder[questionId][etapeWithSameValue] = previousValue;
          } else {
            // Sinon, supprimer simplement la valeur de l'autre étape
            input.value = '';
            delete this.userOrder[questionId][etapeWithSameValue];
          }
        }
      });
    }
    
    // Définir la nouvelle valeur pour l'étape actuelle
    this.userOrder[questionId][etapeText] = value;
    
    console.log('Mise à jour de l\'ordre:', { 
      questionId, 
      etapeText, 
      order: value,
      userOrder: this.userOrder[questionId]
    });
  }
  // Méthode pour réinitialiser les réponses d'ordre
  resetOrderAnswers(question: any): void {
    const questionId = question._id || question.id;
    if (this.userOrder[questionId]) {
      question.etapes.forEach((etape: any) => {
        delete this.userOrder[questionId]?.[etape.texte_etape];
      });
    }
    console.log('Reset order answers for question:', questionId);
  }

  // Méthode pour valider les réponses QCM
  validateQcm(question: any): void {
    if (!question || !question.reponses) {
      alert('Erreur : Les options de la question ne sont pas disponibles.');
      return;
    }
    const questionId = question._id || question.id;
    const userSelectedIndices = this.userAnswers[questionId] || [];
    const result = this.calculateQcmScore(question, userSelectedIndices);

    let message = `Score: ${result.score.toFixed(2)}/${result.maxScore}\n`;
    message += `${result.details}\n`;
    if (result.score >= 0.8) {
      message += "Excellent travail!";
    } else if (result.score >= 0.5) {
      message += "Bien, mais peut être amélioré.";
    } else {
      message += "Révisez cette question.";
    }
    alert(message);
  }


  // Méthode pour générer des variations possibles pour la correction orthographique
  generateVariations(word: string): string[] {
    const variations: string[] = [word];
    const lowerWord = word.toLowerCase();

    // Substitutions phonétiques courantes
    const phoneticSubs: { [key: string]: string[] } = {
      'c': ['k', 's'],
      'k': ['c', 'q'],
      'q': ['k', 'c'],
      's': ['c', 'z'],
      'z': ['s'],
      'f': ['ph', 'v'],
      'ph': ['f'],
      'v': ['f'],
      'j': ['g', 'dj'],
      'g': ['j', 'gu'],
      'è': ['ai', 'e', 'ê', 'ei'],
      'é': ['e', 'er', 'ez', 'ai'],
      'e': ['é', 'è', 'ê', 'ai', 'ei'],
      'o': ['au', 'eau', 'ô'],
      'ô': ['o', 'au'],
      'au': ['o', 'eau'],
      'eau': ['o', 'au'],
      'an': ['en', 'am', 'em'],
      'en': ['an', 'am', 'em'],
      'in': ['ain', 'ein', 'yn'],
      'ain': ['in', 'ein'],
      'i': ['y', 'ee'],
      'y': ['i', 'ee'],
    };

    for (let i = 0; i < lowerWord.length; i++) {
      const char = lowerWord[i];
      const substitutes = phoneticSubs[char];
      if (substitutes) {
        substitutes.forEach(substitute => {
          const variation = lowerWord.slice(0, i) + substitute + lowerWord.slice(i + 1);
          variations.push(variation);
        });
      }
    }

    return [...new Set(variations)];
  }

  // Méthode pour corriger l'orthographe
  checkSpelling(text: string, keywords: string[]): string {
    if (!this.spellCheckerEnabled) return text;

    let correctedText = text;
    const variationDictionary: { [key: string]: string } = {};

    keywords.forEach(keyword => {
      const variations = this.generateVariations(keyword);
      variations.forEach(variation => {
        variationDictionary[variation.toLowerCase()] = keyword;
      });
    });

    const words = correctedText.split(/\s+/);
    const correctedWords = words.map(word => {
      const cleanWord = word.replace(/[.,!?;:"'()\[\]{}]/g, '').toLowerCase();
      if (variationDictionary[cleanWord]) {
        const replacement = variationDictionary[cleanWord];
        if (/^[A-Z]/.test(word)) {
          return word.replace(new RegExp(cleanWord, 'i'), replacement.charAt(0).toUpperCase() + replacement.slice(1));
        }
        return word.replace(new RegExp(cleanWord, 'i'), replacement);
      }
      return word;
    });

    return correctedWords.join(' ');
  }
 
  
// Propriété de classe à ajouter
keywordVariants: KeywordVariants = {
  // Chiffre 1 dans différentes langues et transcriptions
  'un': ['one', 'wahid', 'wahed', 'ouahid', 'واحد', '1'],
  
  // Chiffre 2 dans différentes langues et transcriptions
  'deux': ['two', 'ithnain', 'ethnein', 'اثنين', '2'],
  
  // Chiffre 3 dans différentes langues et transcriptions
  'trois': ['three', 'thalatha', 'talata', 'thalata', 'ثلاثة', '3'],
  
  // Chiffre 4 dans différentes langues et transcriptions
  'quatre': ['four', 'arbaa', 'arba3a', 'أربعة', '4'],
  
  // Chiffre 5 dans différentes langues et transcriptions
 'cinq': [
    'five', 'fiev', 'fiv', 'fife', 'fyve',
    'خمسة', 'خمصه', 'خماسة', 'خمساه',
    'khamsa', 'khamssa', 'khamza', 'khmssa', 'khamsah',
    'kamsa', 'khamca', 'khmza', 'khamsaa',
    'cinq', 'cinque', 'sink', 'sinq', 'cink', 'sinc',
    '5', ' 5 ', '05', 'خمسه', 'خمسا', 'خمسةً'
]

};

// Méthode mise à jour pour gérer les questions libres
updateLibreAnswer(questionId: string, value: string): void {
  // Mettre à jour la réponse libre dans l'objet `libreAnswers`
  this.libreAnswers[questionId] = value;

  // Journalisation pour débogage
  console.log('Réponse libre mise à jour:', { questionId, value });
}


validateLibre(question: any): { score: number, maxScore: number, details: string, keywordsFound: string[] } {
  if (!question || !question.mots_cles) {
    alert('Erreur : Les mots clés de la question ne sont pas disponibles.');
    return { score: 0, maxScore: 0, details: 'Erreur: Mots-clés non disponibles', keywordsFound: [] };
  }

  const questionId = question._id || question.id;
  let userAnswer = this.libreAnswers[questionId] || '';

  if (this.spellCheckerEnabled) {
    userAnswer = this.checkSpelling(userAnswer, question.mots_cles);
    this.libreAnswers[questionId] = userAnswer;
  }

  const userAnswerLower = this.normalizeText(userAnswer.toLowerCase());
  const userWords = userAnswerLower.split(/\s+/);
  const scoreMax = question.score_max || question.mots_cles.length;

  const foundKeywordsSet = new Set<string>();
  const keywordsMatched: { original: string, matched: string }[] = [];

  // 1. Vérifier d'abord si une correspondance "pleine" doit donner le score complet
  for (const motCle of question.mots_cles) {
    const motCleLower = motCle.toLowerCase();
    const variants = [motCleLower, ...(this.keywordVariants[motCleLower] || [])];

    for (const variant of variants) {
      const variantLower = variant.toLowerCase().trim();

      if (userAnswerLower.includes(variantLower)) {
        return {
          score: scoreMax,
          maxScore: scoreMax,
          details: `Réponse correcte détectée avec le mot ou la variante "${variant}"`,
          keywordsFound: [motCle]
        };
      }
    }
  }

  // 2. Sinon, on continue l'analyse normale (par correspondance ou similarité)
  for (const motCle of question.mots_cles) {
    const motCleLower = motCle.toLowerCase();
    if (foundKeywordsSet.has(motCleLower)) continue;

    const variants = this.keywordVariants[motCleLower] || [];

    // Correspondance exacte
    if (userAnswerLower.includes(motCleLower)) {
      foundKeywordsSet.add(motCleLower);
      keywordsMatched.push({ original: motCle, matched: motCle });
      continue;
    }

    // Correspondance par variantes
    for (const variant of variants) {
      if (userAnswerLower.includes(variant.toLowerCase())) {
        foundKeywordsSet.add(motCleLower);
        keywordsMatched.push({ original: motCle, matched: variant });
        break;
      }
    }

    // Correspondance par similarité
    if (!foundKeywordsSet.has(motCleLower)) {
      for (const word of userWords) {
        const similarity = this.calculateSimilarity(word, motCleLower);
        if (similarity >= 0.7) {
          foundKeywordsSet.add(motCleLower);
          keywordsMatched.push({ original: motCle, matched: word });
          break;
        }

        for (const variant of variants) {
          if (this.calculateSimilarity(word, variant.toLowerCase()) >= 0.7) {
            foundKeywordsSet.add(motCleLower);
            keywordsMatched.push({ original: motCle, matched: word + " ≈ " + variant });
            break;
          }
        }

        if (foundKeywordsSet.has(motCleLower)) break;
      }
    }
  }

  const foundKeywords = Array.from(foundKeywordsSet);
  const score = foundKeywords.length > 0 ? (scoreMax * foundKeywords.length / question.mots_cles.length) : 0;

  let details = `Mots-clés trouvés: ${foundKeywords.length}/${question.mots_cles.length}. `;
  if (keywordsMatched.length > 0) {
    details += `Correspondances: ${keywordsMatched.map(k =>
      `${k.original}${k.original !== k.matched ? ` (via "${k.matched}")` : ''}`
    ).join(', ')}`;
  }

  return {
    score: Math.round(score * 10) / 10,
    maxScore: scoreMax,
    details,
    keywordsFound: foundKeywords
  };
}


// Méthode pour normaliser le texte (enlever les accents, etc.)
normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


// Méthode pour calculer la similarité entre deux chaînes (0-1)
calculateSimilarity(str1: string, str2: string): number {
  // Distance de Levenshtein simplifiée
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  // Si la chaîne la plus courte est vide, retourner 0
  if (shorter.length === 0) return 0;
  
  // Calculer la distance de Levenshtein
  const distance = this.levenshteinDistance(longer, shorter);
  
  // Normaliser la distance par rapport à la longueur de la chaîne la plus longue
  return (longer.length - distance) / longer.length;
}

// Calculer la distance de Levenshtein entre deux chaînes
levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // suppression
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  return track[str2.length][str1.length];
}


// Fonction pour afficher les détails du score à n'importe quel moment
debugScoreCalculation(): void {
  console.log('====== DÉBOGAGGE DU CALCUL DU SCORE ======');
  let totalScore = 0;
  let totalPossible = 0;
  
  this.questions.forEach((question, index) => {
    console.log(`Question ${index + 1} (${question.type}):`);
    
    let questionScore = 0;
    let questionPossible = 0;
    
    switch (question.type) {
      case 'multi_vrai_faux':
        if (question.options) {
          questionPossible = question.options.length * 0.5;
          question.options.forEach((option: any, i: number) => {
            const isCorrect = option.userAnswer === option.est_correcte;
            const points = isCorrect ? 0.5 : 0;
            questionScore += points;
            console.log(`  Option ${i+1}: réponse=${option.userAnswer}, correcte=${option.est_correcte}, points=${points}`);
          });
        }
        break;
        
      case 'VRAI_FAUX':
        if (question.reponses) {
          questionPossible = question.reponses.length * 0.5;
          question.reponses.forEach((reponse: any, i: number) => {
            const isCorrect = reponse.userAnswer === reponse.est_correcte;
            const points = isCorrect ? 0.5 : 0;
            questionScore += points;
            console.log(`  Réponse ${i+1}: réponse=${reponse.userAnswer}, correcte=${reponse.est_correcte}, points=${points}`);
          });
        }
        break;
        
      // Autres types de questions...
    }
    
    console.log(`  Score question: ${questionScore}/${questionPossible}`);
    totalScore += questionScore;
    totalPossible += questionPossible;
  });
  
  console.log('====== RÉSUMÉ ======');
  console.log(`Score total: ${totalScore}/${totalPossible} (${totalPossible > 0 ? (totalScore/totalPossible*100).toFixed(2) : 0}%)`);
  console.log('====== FIN DU DÉBOGAGGE ======');
}

// Fonction pour afficher les données du quiz
displayQuizData(): void {
  console.log('====== DONNÉES DU QUIZ ======');
  this.questions.forEach((question, index) => {
    console.log(`Question ${index+1}: ${question.type}`);
    console.log('  Contenu:', question);
    
    if (question.type === 'multi_vrai_faux' && question.options) {
      console.log('  Options:');
      question.options.forEach((opt: any, i: number) => {
        console.log(`    Option ${i+1}: ${opt.texte_option}`);
        console.log(`      est_correcte: ${opt.est_correcte}`);
        console.log(`      userAnswer: ${opt.userAnswer}`);
      });
    }
    
    if (question.type === 'VRAI_FAUX' && question.reponses) {
      console.log('  Réponses:');
      question.reponses.forEach((rep: any, i: number) => {
        console.log(`    Réponse ${i+1}: ${rep.texte_reponse}`);
        console.log(`      est_correcte: ${rep.est_correcte}`);
        console.log(`      userAnswer: ${rep.userAnswer}`);
      });
    }
  });
  console.log('====== FIN DES DONNÉES ======');
}

// Méthode pour gérer les questions de type VRAI_FAUX

calculateQcmScore(question: any, userSelectedIndices: number[]): { score: number, maxScore: number, details: string } {
  const totalOptions = question.reponses.length;
  
  // Si aucune réponse sélectionnée → 0 point
  if (userSelectedIndices.length === 0) {
    return {
      score: 0,
      maxScore: 1,
      details: "Aucune réponse sélectionnée."
    };
  }
  
  // Récupérer les indices des bonnes réponses
  const correctIndices = question.reponses
    .map((reponse: any, index: number) => reponse.est_correcte ? index : -1)
    .filter((index: number) => index !== -1);
  
  const correctCount = correctIndices.length;
  
  // Si aucune réponse correcte définie → erreur système
  if (correctCount === 0) {
    return {
      score: 0,
      maxScore: 1,
      details: "Erreur : Aucune réponse correcte trouvée dans cette question."
    };
  }
  
  // CAS INTERDIT : Toutes les options cochées
  if (userSelectedIndices.length === totalOptions) {
    return {
      score: 0,
      maxScore: 1,
      details: "Toutes les options sont cochées. Score = 0."
    };
  }
  
  // CAS SPÉCIAL : Question à réponse unique mais plusieurs réponses cochées
  if (correctCount === 1 && userSelectedIndices.length > 1) {
    return {
      score: 0,
      maxScore: 1,
      details: "Question à réponse unique : plusieurs réponses sélectionnées. Score = 0."
    };
  }
  
  // Compter les bonnes et mauvaises réponses
  const correctSelected = userSelectedIndices.filter(i => correctIndices.includes(i)).length;
  const incorrectSelected = userSelectedIndices.length - correctSelected;
  const missedCorrect = correctCount - correctSelected;
  
  // Calcul de la pénalité par réponse incorrecte/manquante (1/nombre total d'options)
  const penaltyPerAnswer = 1 / totalOptions;
  
  let score = 1.0; // On commence avec le score maximum
  let details = "";
  
  // Déduction pour les bonnes réponses manquées
  if (missedCorrect > 0) {
    const missedPenalty = missedCorrect * penaltyPerAnswer;
    score -= missedPenalty;
    details += `${missedCorrect} bonne(s) réponse(s) manquée(s): -${Math.round(missedPenalty * 100) / 100}. `;
  }
  
  // Déduction pour les mauvaises réponses sélectionnées
  if (incorrectSelected > 0) {
    const incorrectPenalty = incorrectSelected * penaltyPerAnswer;
    score -= incorrectPenalty;
    details += `${incorrectSelected} mauvaise(s) réponse(s) sélectionnée(s): -${Math.round(incorrectPenalty * 100) / 100}. `;
  }
  
  // Vérifier si le score est parfait
  if (score === 1.0) {
    details = "Parfait ! Toutes les bonnes réponses ont été sélectionnées.";
  }
  // Empêcher un score négatif
  else if (score < 0) {
    score = 0;
    details += "Score limité à 0.";
  }
  else {
    details += `Score final: ${Math.round(score * 100) / 100}/1.`;
  }
  
  return {
    score: Math.round(score * 100) / 100, // arrondir à 2 chiffres après la virgule
    maxScore: 1,
    details: details
  };
}


// Fonction de débogage des structures de données pour les espaces vides
debugEspacesVides(question: any): void {
  const questionId = question._id || question.id;

  console.log('===== DÉBOGAGE ESPACES VIDES =====');
  console.log('ID Question:', questionId);
  console.log('Structure de la question:', question);
  
  if (!question.espaces || question.espaces.length === 0) {
    console.warn('⚠️ PAS D\'ESPACES DÉFINIS DANS LA QUESTION');
    
    // Rechercher où pourraient se trouver les espaces dans d'autres formats possibles
    console.log('Clés disponibles dans l\'objet question:', Object.keys(question));
    
    // Essayer de trouver une propriété similaire
    const possibleSpacesProperties = ['espaces', 'spaces', 'blanks', 'trous', 'vides'];
    for (const prop of possibleSpacesProperties) {
      if (question[prop]) {
        console.log(`✓ Trouvé des espaces dans la propriété "${prop}":`, question[prop]);
      }
    }
    
    return;
  }
  
  console.log('Espaces définis:', question.espaces);

  // Analyser la structure de chaque espace
  question.espaces.forEach((espace: any, index: number) => {
    console.log(`Espace #${index + 1} (Position: ${espace.position}):`);
    console.log('  Propriétés disponibles:', Object.keys(espace));
    
    // Vérifier les propriétés importantes
    if (espace.reponse) {
      console.log('  ✓ Réponse exacte:', espace.reponse);
    } else {
      console.warn('  ⚠️ Pas de réponse exacte définie!');
    }
    
    // Vérifier les mots-clés (différentes notations possibles)
    if (espace.mots_cles && Array.isArray(espace.mots_cles)) {
      console.log('  ✓ Mots-clés (mots_cles):', espace.mots_cles);
    } else if (espace.motsClefs && Array.isArray(espace.motsClefs)) {
      console.log('  ✓ Mots-clés (motsClefs):', espace.motsClefs);
    } else if (espace.keywords && Array.isArray(espace.keywords)) {
      console.log('  ✓ Mots-clés (keywords):', espace.keywords);
    } else {
      console.warn('  ⚠️ Pas de mots-clés définis!');
    }
    
    // Vérifier la réponse de l'utilisateur
    const userKey = `${questionId}_${espace.position}`;
    if (this.blankAnswers && this.blankAnswers[userKey]) {
      console.log('  ✓ Réponse utilisateur:', this.blankAnswers[userKey]);
    } else {
      console.warn('  ⚠️ Pas de réponse utilisateur pour cet espace!');
    }
  });
  
  console.log('===== FIN DÉBOGAGE =====');
}
getExpectedInput(question: any, item: any): string {
  if (!question.options_droite || !Array.isArray(question.options_droite)) {
    return '';
  }

  const expected = question.options_droite.find((option: any) => {
    return option.option_gauche_id === item.id;
  });

  return expected ? expected.texte : 'Réponse non définie';
}





// 5. Version modifiée de la méthode submitQuiz
submitQuiz(): void {
    this.stopTimer();
    const submissions: any[] = [];
    let totalScore = 0;
    let totalPossibleScore = 0;
    let unansweredQuestions = 0;
    let qcmScore = 0, qcmTotal = 0;
    let libreScore = 0, libreTotal = 0;
    let ordonnerScore = 0, ordonnerTotal = 0;
    let multiTFScore = 0, multiTFTotal = 0;
    let vraiTFScore = 0, vraiTFTotal = 0;
    let espacesVideScore = 0, espacesVideTotal = 0;
    let appariementScore = 0, appariementTotal = 0;

    this.questions.forEach((question) => {
      const questionId = question._id?.$oid || question.id;
      const questionType = question.type.toUpperCase();
      let result: { score: number, possibleScore: number, unanswered: number, submission: any } = {
        score: 0,
        possibleScore: 0,
        unanswered: 0,
        submission: null
      };

      console.log(`Traitement de la question ${questionId} de type ${questionType}`);

      switch (questionType) {
        case 'QCM':
          result = this.handleQcmQuestion(question);
          qcmScore += result.score;
          qcmTotal += result.possibleScore;
          break;
        case 'LIBRE':
          result = this.handleLibreQuestion(question);
          libreScore += result.score;
          libreTotal += result.possibleScore;
          break;
        case 'ORDONNER':
          result = this.handleOrderingQuestion(question);
          ordonnerScore += result.score;
          ordonnerTotal += result.possibleScore;
          break;
        case 'MULTI_VRAI_FAUX':
          result = this.handleMultiTrueFalseQuestion(question);
          multiTFScore += result.score;
          multiTFTotal += result.possibleScore;
          break;
        case 'VRAI_FAUX':
          result = this.handleTrueFalseQuestion(question);
          vraiTFScore += result.score;
          vraiTFTotal += result.possibleScore;
          break;
        case 'ESPACES_VIDES':
          result = this.handleBlankSpacesQuestion(question);
          espacesVideScore += result.score;
          espacesVideTotal += result.possibleScore;
          break;
        case 'APPARIEMENT':
          result = this.handleAppariementQuestion(question);
          appariementScore += result.score;
          appariementTotal += result.possibleScore;
          break;
        default:
          console.warn(`Type de question non pris en charge: ${question.type}`);
      }

      if (result.submission) {
        submissions.push(result.submission);
      } else {
        console.warn(`Pas de soumission pour la question ${questionId}`);
      }

      totalScore += result.score;
      totalPossibleScore += result.possibleScore;
      unansweredQuestions += result.unanswered;

      console.log(`Question ${questionId} (${question.type}):`, {
        score: result.score,
        possibleScore: result.possibleScore,
        unanswered: result.unanswered,
        submissionDetails: result.submission
      });
    });

    if (unansweredQuestions > 0) {
      const confirmSubmit = confirm(`⚠️ Attention : ${unansweredQuestions} question(s) incomplète(s). Soumettre quand même ?`);
      if (!confirmSubmit) return;
    }

    totalScore = Math.round(totalScore * 10) / 10;
    const scorePercentage = totalPossibleScore > 0 ? ((totalScore / totalPossibleScore) * 100).toFixed(2) : '0.00';

    console.log('⚡ Avant soumission:');
    console.log('  🔢 QCM:', qcmScore, '/', qcmTotal);
    console.log('  🔢 Libre:', libreScore, '/', libreTotal);
    console.log('  🔢 Ordonner:', ordonnerScore, '/', ordonnerTotal);
    console.log('  🔢 Multi Vrai/Faux:', multiTFScore, '/', multiTFTotal);
    console.log('  🔢 Vrai/Faux:', vraiTFScore, '/', vraiTFTotal);
    console.log('  🔢 Espaces vides:', espacesVideScore, '/', espacesVideTotal);
    console.log('  🔢 Appariement:', appariementScore, '/', appariementTotal);

    const payload = {
      candidateId: this.candidateId,
      candidateName: this.candidateName,
      candidateEmail: this.candidateEmail,
      submissions,
      totalScore,
      totalPossibleScore,
      scorePercentage,
      quizStartTime: this.startTime?.toISOString(),
      quizEndTime: new Date().toISOString(),
      quizDuration: this.quizDuration,
      formattedDuration: this.elapsedTime,
      detailedScores: {
        qcm: { score: qcmScore, total: qcmTotal },
        libre: { score: libreScore, total: libreTotal },
        ordonner: { score: ordonnerScore, total: ordonnerTotal },
        multiVraiFaux: { score: multiTFScore, total: multiTFTotal },
        vraiFaux: { score: vraiTFScore, total: vraiTFTotal },
        espacesVides: { score: espacesVideScore, total: espacesVideTotal },
        appariement: { score: appariementScore, total: appariementTotal }
      }
    };

    console.log('🔍 Réponses soumises:', JSON.stringify(submissions, null, 2));
    console.log('📊 Score total:', totalScore);
    console.log('🎯 Score max:', totalPossibleScore);
    console.log('📈 Pourcentage:', scorePercentage);

    this.http.post('https://training-backend-1pda.onrender.com/api/answers/submit_quiz', payload).subscribe(
      (response: any) => {
        console.log('✅ Réponses soumises avec succès:', response);
        let resultMessage = `🏁 Quiz terminé !\n\n`;
        resultMessage += `Candidat: ${this.candidateName} (${this.candidateEmail})\n\n`;
        resultMessage += `Votre score final: ${totalScore.toFixed(1)} / ${totalPossibleScore} (${scorePercentage}%)\n\n`;

        if (qcmTotal > 0) resultMessage += `🔹 QCM: ${qcmScore.toFixed(1)}/${qcmTotal}\n`;
        if (libreTotal > 0) resultMessage += `🔹 Libre: ${libreScore.toFixed(1)}/${libreTotal}\n`;
        if (ordonnerTotal > 0) resultMessage += `🔹 Ordonner: ${ordonnerScore.toFixed(1)}/${ordonnerTotal}\n`;
        if (multiTFTotal > 0) resultMessage += `🔹 Multi Vrai/Faux: ${multiTFScore.toFixed(1)}/${multiTFTotal}\n`;
        if (vraiTFTotal > 0) resultMessage += `🔹 Vrai/Faux: ${vraiTFScore.toFixed(1)}/${vraiTFTotal}\n`;
        if (espacesVideTotal > 0) resultMessage += `🔹 Espaces vides: ${espacesVideScore.toFixed(1)}/${espacesVideTotal}\n`;
        if (appariementTotal > 0) resultMessage += `🔹 Appariement: ${appariementScore.toFixed(1)}/${appariementTotal}\n`;

        const percentage = totalPossibleScore > 0 ? totalScore / totalPossibleScore : 0;
        if (percentage >= 0.8) {
          resultMessage += "🎉 Excellent travail ! Vous maîtrisez bien ce sujet.";
        } else if (percentage >= 0.6) {
          resultMessage += "👍 Bon travail ! Quelques points à améliorer.";
        } else if (percentage >= 0.4) {
          resultMessage += "🔽 Résultat passable. Une révision approfondie est recommandée.";
        } else {
          resultMessage += "❌ Des difficultés avec ce sujet. Une révision complète est nécessaire.";
        }

        alert(resultMessage);
      },
      (error) => {
        console.error('❌ Erreur lors de la soumission:', error);
        alert('Une erreur est survenue lors de la soumission.');
      }
    );
  }

 


// Les méthodes existantes que vous aviez déjà
getInputKey(question: any, gauche: any, inputIndex: number): string {
  const questionId = question._id || question.id;
  return `${questionId}_${gauche.id}_${inputIndex}`;
}


// Nouvelle méthode pour obtenir les valeurs correctes spécifiques à un input
getCorrectValuesForInput(question: any, gauche: any, inputIndex: number): string[] {
  if (!question.correspondances) return [];
  
  // Trouver la correspondance pour cette option gauche
  const correspondance = question.correspondances.find((c: any) => c.gauche_id === gauche.id);
  
  if (correspondance) {
    if (Array.isArray(correspondance.droite_id)) {
      // Si nous avons plusieurs droite_id, prendre celui à l'index (inputIndex - 1)
      if (inputIndex <= correspondance.droite_id.length) {
        const droiteId = correspondance.droite_id[inputIndex - 1];
        const droite = question.options_droite.find((d: any) => d.id === droiteId);
        return droite ? [droite.id.toString(), droite.texte] : [];
      }
    } else {
      // Si un seul droite_id
      const droite = question.options_droite.find((d: any) => d.id === correspondance.droite_id);
      return droite ? [droite.id.toString(), droite.texte] : [];
    }
  }
  
  return [];
}

// Vérifier si la réponse est correcte
isAnswerCorrect(userAnswer: string, correctValues: string[]): boolean {
  if (!userAnswer || correctValues.length === 0) return false;
  
  // Nettoyer la réponse
  const cleanedAnswer = this.normaliserTexte(userAnswer);
  
  // Vérifier si la réponse correspond à une des valeurs correctes
  return correctValues.some(value => {
    const cleanedValue = this.normaliserTexte(value);
    return cleanedAnswer === cleanedValue || cleanedAnswer.includes(cleanedValue);
  });
}

// Fonction pour normaliser un texte (minuscules, sans accents)
normaliserTexte(texte: string): string {
  if (!texte) return '';
  
  return texte.toString().toLowerCase()
    .normalize("NFD") // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les signes diacritiques
    .trim();
}

validateAppariement(question: any): void {
  if (!question || !question.options_gauche) {
    alert('Erreur : Les données de la question sont incomplètes.');
    return;
  }
  
  let correctAnswers = 0;
  let totalInputs = 0;
  const feedback: string[] = [];
  
  // Parcourir toutes les options gauches
  question.options_gauche.forEach((gauche: any) => {
    // Déterminer combien d'inputs pour cette option
    const inputIndices = this.getInputIndices(question, gauche);
    totalInputs += inputIndices.length;
    
    // Vérifier chaque input
    inputIndices.forEach((inputIndex: number) => {
      const key = this.getInputKey(question, gauche, inputIndex);
      const userAnswer = this.matchingInputs[key] || '';
      
      // Récupérer les correspondances correctes pour cette option et cet input
      const correctValues = this.getCorrectValuesForInput(question, gauche, inputIndex);
      
      // Vérifier si la réponse est correcte
      const isCorrect = this.isAnswerCorrect(userAnswer, correctValues);
      
      if (isCorrect) {
        correctAnswers++;
        feedback.push(`✓ "${gauche.texte}" (Input ${inputIndex}): Réponse correcte`);
      } else {
        feedback.push(`✗ "${gauche.texte}" (Input ${inputIndex}): Réponse incorrecte (vous avez répondu: "${userAnswer}")`);
        
        // Ajouter les valeurs attendues
        if (correctValues.length > 0) {
          feedback.push(`  Valeurs attendues: ${correctValues.join(' ou ')}`);
        }
      }
    });
  });
  
  // Calculer le score (même méthode que dans handleAppariementQuestion)
  const score = totalInputs > 0 ? correctAnswers / totalInputs : 0;
  const scorePercentage = (score * 100).toFixed(2);
  
  // Afficher les résultats
  let message = `Score: ${score.toFixed(2)}/1 (${scorePercentage}%)\n`;
  message += `Réponses correctes: ${correctAnswers}/${totalInputs}\n\n`;
  message += feedback.join('\n');
  
  // Ajouter un feedback général selon le score
  if (score >= 0.8) {
    message += "\n\nExcellent travail!";
  } else if (score >= 0.5) {
    message += "\n\nBien, mais peut être amélioré.";
  } else {
    message += "\n\nRévisez cette question.";
  }
  
  alert(message);
}

//-------111--------111------------111---------
evaluateBlankQuestion(question: any): any {
  const result = {
    score: 0,
    details: ''
  };

  if (!question.espaces || question.espaces.length === 0) {
    return result;
  }

  const questionId = question._id || question.id;
  let detailsArray: string[] = [];
  
  // Affichage debug pour voir la structure exacte
  console.log('Structure des espaces:', JSON.stringify(question.espaces, null, 2));

  question.espaces.forEach((espace: any) => {
    const userAnswerKey = `${questionId}_${espace.position}`;
    const userAnswer = this.blankAnswers[userAnswerKey]?.trim() ?? '';

    if (!userAnswer) {
      detailsArray.push(`Espace ${espace.position}: Non répondu`);
      return;
    }

    const evaluationResult = this.evaluateSingleBlankSpace(espace, userAnswer);
    result.score += evaluationResult.score;
    detailsArray.push(`Espace ${espace.position}: ${evaluationResult.score} (${evaluationResult.reason})`);
  });

  result.details = detailsArray.join('; ');
  return result;
}

// Met à jour la réponse d'un espace vide
updateBlankAnswer(questionId: string, position: number, value: string): void {
  const key = `${questionId}_${position}`;
  if (!this.blankAnswers) {
    this.blankAnswers = {};
  }
  this.blankAnswers[key] = value;
  console.log('Mise à jour réponse espace vide:', { key, value });
}

// Valide les réponses à espaces vides et affiche le résultat
validateEspacesVides(question: any): void {
  if (!question || !question.espaces) {
    alert('Erreur : Les espaces de la question ne sont pas disponibles.');
    return;
  }

  const questionId = question._id || question.id;

  console.log('État des réponses pour la question:', {
    questionId,
    espaces: question.espaces,
    blankAnswers: this.blankAnswers
  });

  const result = this.evaluateBlankQuestion(question);
  let message = `Score: ${result.score}/${question.espaces.length}\n\nDétails: ${result.details}\n\n`;

  if (result.score === question.espaces.length) {
    message += "✅ Parfait ! Toutes les réponses sont correctes.";
  } else if (result.score > 0) {
    message += "⚠️ Certaines réponses sont correctes. Continuez vos efforts !";
  } else {
    message += "❌ Aucune réponse correcte. Réessayez.";
  }

  alert(message);
}

// Méthode d'évaluation d'un espace vide unique
private evaluateSingleBlankSpace(espace: any, userAnswer: string): { score: number, reason: string } {
  if (!userAnswer) {
    return { score: 0, reason: 'Non répondu' };
  }

  // Normaliser la réponse de l'utilisateur
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  
  // Utiliser le bon champ selon la structure de données
  // Vérifier d'abord reponses_attendues, puis d'autres champs possibles
  let acceptedAnswers: string[] = [];
  
  if (Array.isArray(espace.reponses_attendues)) {
    acceptedAnswers = espace.reponses_attendues;
  } else if (Array.isArray(espace.reponses_acceptees)) {
    acceptedAnswers = espace.reponses_acceptees;
  } else if (espace.reponse_correcte) {
    acceptedAnswers = [espace.reponse_correcte];
  } else {
    console.warn('Aucune réponse définie pour l\'espace', espace.position);
    return { score: 0, reason: 'Problème de configuration' };
  }
  
  // Vérifier si la réponse de l'utilisateur correspond à l'une des réponses acceptables
  for (const answer of acceptedAnswers) {
    if (typeof answer === 'string' && answer.trim().toLowerCase() === normalizedUserAnswer) {
      return { score: 1, reason: 'Réponse correcte' };
    }
  }
  
  return { score: 0, reason: 'Réponse incorrecte' };
}

// Traitement d'une question complète à espaces vides


// Fonction de débogage complète
debugEspaceVide(question: any): void {
  console.log('=== DEBUG ESPACES VIDES ===');
  console.log('Question ID:', question._id || question.id);
  console.log('Type:', question.type);
  
  if (!question.espaces || !Array.isArray(question.espaces)) {
    console.error('❌ Pas d\'espaces trouvés dans la question!');
    console.log('Structure de la question:', JSON.stringify(question, null, 2));
    return;
  }
  
  console.log(`✅ Nombre d'espaces: ${question.espaces.length}`);
  
  question.espaces.forEach((espace: any, index: number) => {
    console.log(`\n--- Espace #${index + 1} (Position: ${espace.position}) ---`);
    
    // Vérifier les réponses attendues
    if (espace.reponses_attendues && Array.isArray(espace.reponses_attendues)) {
      console.log('✅ Réponses attendues:', espace.reponses_attendues);
    } else if (espace.reponse_correcte) {
      console.log('✅ Réponse correcte unique:', espace.reponse_correcte);
    } else if (espace.reponses_acceptees && Array.isArray(espace.reponses_acceptees)) {
      console.log('✅ Réponses acceptées:', espace.reponses_acceptees);
    } else {
      console.error('❌ Aucune réponse correcte définie!');
      console.log('Structure de l\'espace:', JSON.stringify(espace, null, 2));
    }
    
    // Vérifier la réponse utilisateur
    const userAnswerKey = `${question._id || question.id}_${espace.position}`;
    if (this.blankAnswers && this.blankAnswers[userAnswerKey]) {
      console.log('✅ Réponse utilisateur:', this.blankAnswers[userAnswerKey]);
      
      // Simuler l'évaluation
      const evaluation = this.evaluateSingleBlankSpace(espace, this.blankAnswers[userAnswerKey]);
      console.log(`✅ Évaluation: score=${evaluation.score}, raison=${evaluation.reason}`);
    } else {
      console.warn('⚠️ Pas de réponse utilisateur pour cet espace');
    }
  });
  
  console.log('=== FIN DEBUG ===');
}
 ngOnDestroy(): void {
    // Nettoyer l'intervalle pour éviter les fuites mémoire
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // Méthode utilitaire pour afficher un avertissement de temps
  showTimeWarning(remainingMinutes: number): void {
    alert(`⚠️ Attention : Il vous reste ${remainingMinutes} minute(s) pour terminer le quiz !`);
  }

  // Méthode pour définir une limite de temps (optionnel)
  setTimeLimit(minutes: number): void {
    const timeLimitMs = minutes * 60 * 1000;
    
    setTimeout(() => {
      if (this.isTimerRunning) {
        alert('⏰ Temps écoulé ! Le quiz va être soumis automatiquement.');
        this.submitQuiz();
      }
    }, timeLimitMs);

    // Avertissements à 5 et 1 minute(s) avant la fin
    if (minutes > 5) {
      setTimeout(() => {
        if (this.isTimerRunning) {
          this.showTimeWarning(5);
        }
      }, (timeLimitMs - 5 * 60 * 1000));
    }

    if (minutes > 1) {
      setTimeout(() => {
        if (this.isTimerRunning) {
          this.showTimeWarning(1);
        }
      }, (timeLimitMs - 1 * 60 * 1000));
    }
  }
  getCharacterCount(questionId: string): number {
  const answer = this.libreAnswers[questionId] || '';
  return answer.length;
}

/**
 * Méthode utilitaire pour formater le temps de début en format lisible
 */
getFormattedStartTime(): string {
  if (!this.startTime) return 'Non défini';
  
  return this.startTime.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Obtient des statistiques détaillées du timing
 */
getTimingStats(): any {
  const stats = {
    totalTime: this.elapsedTime,
    totalSeconds: this.quizDuration,
    averagePerQuestion: this.getAverageTimePerQuestion(),
    progressPercentage: this.getProgressPercentage(),
    // answeredCount: this.getAnsweredQuestionsCount(),
    // remainingQuestions: this.questions.length - this.getAnsweredQuestionsCount(),
    // estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
    startTime: this.getFormattedStartTime(),
    isRunning: this.isTimerRunning
  };
  
  return stats;
}
getAverageTimePerQuestion(): string {
  if (this.questions.length === 0 || this.quizDuration === 0) {
    return '00:00';
  }
  
  const averageSeconds = Math.floor(this.quizDuration / this.questions.length);
  const minutes = Math.floor(averageSeconds / 60);
  const seconds = averageSeconds % 60;
  
  return `${this.padZero(minutes)}:${this.padZero(seconds)}`;
}

/**
 * Affiche les statistiques de timing dans la console (pour debug)
 */
debugTimingStats(): void {
  console.log('=== STATISTIQUES DE TIMING ===');
  const stats = this.getTimingStats();
  console.table(stats);
  console.log('===============================');
}

/**
 * Détermine si le quiz prend trop de temps (optionnel)
 */
isQuizTakingTooLong(): boolean {
  // Considérer qu'un quiz prend trop de temps s'il dépasse 2 minutes par question en moyenne
  const maxSecondsPerQuestion = 120; // 2 minutes
  const currentAverageSeconds = this.questions.length > 0 ? this.quizDuration / this.questions.length : 0;
  
  return currentAverageSeconds > maxSecondsPerQuestion;
}

/**
 * Obtient un message d'encouragement basé sur le temps
 */
getTimingEncouragementMessage(): string {
  const progressPercentage = parseFloat(this.getProgressPercentage());
  const averageSeconds = this.questions.length > 0 ? this.quizDuration / this.questions.length : 0;
  
  if (progressPercentage === 100) {
    return 'ممتاز! لقد أكملت جميع الأسئلة.';
  } else if (progressPercentage >= 75) {
    return 'أحسنت! أنت قريب من النهاية.';
  } else if (progressPercentage >= 50) {
    return 'استمر! أنت في منتصف الطريق.';
  } else if (progressPercentage >= 25) {
    return 'بداية جيدة! واصل التقدم.';
  } else {
    return 'ابدأ بهدوء وثقة.';
  }
}
getDurationInMinutes(): string {
  const minutes = Math.floor(this.quizDuration / 60);
  const seconds = this.quizDuration % 60;
  return `${minutes}.${Math.floor((seconds / 60) * 100)}min`;
}

/**
 * Calcule le pourcentage de progression estimé
 */
getProgressPercentage(): string {
  if (this.questions.length === 0) return '0';
  
  let answeredCount = 0;
  
  // Compter les questions répondues
  this.questions.forEach(question => {
    const questionId = question._id || question.id;
    const questionType = question.type?.toUpperCase();
    
    switch (questionType) {
      case 'QCM':
        if (this.userAnswers[questionId] && this.userAnswers[questionId].length > 0) {
          answeredCount++;
        }
        break;
      case 'LIBRE':
        if (this.libreAnswers[questionId] && this.libreAnswers[questionId].trim()) {
          answeredCount++;
        }
        break;
      case 'ORDONNER':
        if (this.userOrder[questionId] && Object.keys(this.userOrder[questionId]).length > 0) {
          answeredCount++;
        }
        break;
      case 'MULTI_VRAI_FAUX':
        if (question.options && question.options.some((opt: any) => opt.userAnswer !== undefined)) {
          answeredCount++;
        }
        break;
      case 'VRAI_FAUX':
        if (question.reponses && question.reponses.some((rep: any) => rep.userAnswer !== undefined)) {
          answeredCount++;
        }
        break;
      case 'ESPACES_VIDES':
        if (question.espaces && question.espaces.some((esp: any) => {
          const key = `${questionId}_${esp.position}`;
          return this.blankAnswers[key] && this.blankAnswers[key].trim();
        })) {
          answeredCount++;
        }
        break;
      case 'APPARIEMENT':
        if (question.options_gauche && question.options_gauche.some((gauche: any) => {
          const inputIndices = this.getInputIndices(question, gauche);
          return inputIndices.some((index: number) => {
            const key = this.getInputKey(question, gauche, index);
            return this.matchingInputs[key] && this.matchingInputs[key].trim();
          });
        })) {
          answeredCount++;
        }
        break;
    }
  });
  
  const percentage = Math.round((answeredCount / this.questions.length) * 100);
  return percentage.toString();
}




private handleBlankSpacesQuestion(question: any): { score: number, possibleScore: number, unanswered: number, submission: any } {
  const questionId = question._id?.$oid || question.id;
  let score = 0;
  const possibleScore = 1; // Total score for the question is 1
  let unansweredCount = 0;
  let correctCount = 0;
  const totalSpaces = question.espaces?.length || 0;

  const submission = {
    questionId,
    type: 'ESPACES_VIDES',
    answers: {} as { [key: string]: string },
    score: 0,
    possibleScore
  };

  if (totalSpaces === 0) {
    console.warn(`Question ${questionId} has no spaces defined`);
    return { score: 0, possibleScore, unanswered: 1, submission };
  }

  question.espaces.forEach((espace: any) => {
    const userAnswerKey = `${questionId}_${espace.position}`;
    const userAnswer = this.blankAnswers[userAnswerKey]?.trim() ?? '';
    submission.answers[espace.position] = userAnswer;

    if (!userAnswer) {
      unansweredCount++;
      console.log(`Space ${espace.position}: No answer provided`);
    } else {
      const isCorrect = espace.reponses_attendues?.some((attendue: string) =>
        userAnswer.toLowerCase() === attendue.toLowerCase()
      );
      if (isCorrect) {
        correctCount++;
        console.log(`Space ${espace.position}: Correct, +${1/totalSpaces} points`);
      } else {
        console.log(`Space ${espace.position}: Incorrect, answer=${userAnswer}, expected=${espace.reponses_attendues.join(', ')}`);
      }
    }
  });

  // Each correct space contributes 1/n to the score
  score = totalSpaces > 0 ? (correctCount / totalSpaces) : 0;
  submission.score = score;

  console.log('ESPACES_VIDES submission:', {
    questionId,
    score,
    possibleScore,
    correctCount,
    totalSpaces,
    answers: submission.answers
  });

  return {
    score,
    possibleScore,
    unanswered: unansweredCount === totalSpaces ? 1 : 0,
    submission
  };
}


private handleLibreQuestion(question: any): { score: number, possibleScore: number, unanswered: number, submission: any } {
  const questionId = question._id?.$oid || question.id;
  const answer = this.libreAnswers[questionId]?.trim() ?? '';
  let score = 0;
  const possibleScore = 1; // Total score for the question is 1
  const unanswered = answer.length === 0 ? 1 : 0;

  const submission = {
    questionId,
    type: 'LIBRE',
    answer,
    score: 0,
    possibleScore
  };

  if (answer && question.mots_cles?.length > 0) {
    const isCorrect = question.mots_cles.some((mot: string) =>
      answer.toLowerCase().includes(mot.toLowerCase())
    );
    score = isCorrect ? possibleScore : 0;
    console.log(`LIBRE answer: ${answer}, ${isCorrect ? `Correct, +${possibleScore} points` : 'Incorrect, 0 points'}`);
  } else if (!question.mots_cles || question.mots_cles.length === 0) {
    console.warn(`Question ${questionId} has no keywords defined`);
  }

  submission.score = score;

  console.log('LIBRE submission:', {
    questionId,
    score,
    possibleScore,
    answer
  });

  return {
    score,
    possibleScore,
    unanswered,
    submission
  };
}


private handleOrderingQuestion(question: any): { score: number, possibleScore: number, unanswered: number, submission: any } {
  const questionId = question._id?.$oid || question.id;
  const order = this.userOrder[questionId] || {};
  let score = 0;
  const possibleScore = 1; // Total score for the question is 1
  let unansweredCount = 0;
  let correctCount = 0;
  const totalSteps = question.etapes?.length || 0;

  const submission = {
    questionId,
    type: 'ORDONNER',
    order: {} as { [key: string]: number },
    score: 0,
    possibleScore
  };

  if (!question.etapes || question.etapes.length === 0) {
    console.warn(`Question ${questionId} has no steps defined`);
    return { score: 0, possibleScore, unanswered: 1, submission };
  }

  const allStepsUnanswered = question.etapes.every((etape: any) => !order[etape.texte_etape] || order[etape.texte_etape] === 0);
  if (allStepsUnanswered) {
    unansweredCount = 1;
  }

  question.etapes.forEach((etape: any) => {
    const userOrderValue = order[etape.texte_etape] || 0;
    submission.order[etape.texte_etape] = userOrderValue;

    if (userOrderValue === 0) {
      console.log(`Step ${etape.texte_etape}: No order provided`);
    } else if (userOrderValue === etape.ordre) {
      correctCount++;
      console.log(`Step ${etape.texte_etape}: Correct order=${userOrderValue}, +${1/totalSteps} points`);
    } else {
      console.log(`Step ${etape.texte_etape}: Incorrect order=${userOrderValue}, expected=${etape.ordre}`);
    }
  });

  // Each correct step contributes 1/n to the score, where n is the number of steps
  score = totalSteps > 0 ? (correctCount / totalSteps) : 0;
  submission.score = score;

  console.log('ORDONNER submission:', {
    questionId,
    score,
    possibleScore,
    correctCount,
    totalSteps,
    order: submission.order
  });

  return {
    score,
    possibleScore,
    unanswered: unansweredCount,
    submission
  };
}
// Méthodes de scoring corrigées

// 1. CORRECTION POUR QCM - Méthode de scoring
private handleQcmQuestion(question: any): { score: number, possibleScore: number, unanswered: number, submission: any } {
  const questionId = question._id?.$oid || question.id;
  const answers = this.userAnswers[questionId] || [];
  let score = 1; // Start with a full score
  const possibleScore = 1;
  let unansweredCount = 0;

  const submission = {
    questionId,
    type: 'QCM',
    answers: [] as Array<{
      reponseId: string;
      texte_reponse: string;
      userSelected: boolean;
    }>,
    score: 0,
    possibleScore
  };

  // Vérification des réponses disponibles
  if (!question.reponses || question.reponses.length === 0) {
    console.warn(`Question ${questionId} has no responses defined`);
    return { score: 0, possibleScore, unanswered: 1, submission };
  }

  const totalOptions = question.reponses.length;
  const totalCorrectResponses = question.reponses?.filter((r: any) => r.est_correcte === true || r['est_correctه'] === true).length || 0;
  const totalSelectedAnswers = answers.length;

  // Si aucune réponse sélectionnée
  if (totalSelectedAnswers === 0) {
    unansweredCount = 1;
    score = 0;
    console.log(`Question ${questionId}: No answers selected, score = 0`);
  }

  // NOUVELLE VÉRIFICATION: Si toutes les options sont sélectionnées, score = 0
  if (totalSelectedAnswers === totalOptions) {
    score = 0;
    console.log(`Question ${questionId}: All options selected, score = 0`);
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let missedCorrectCount = 0;

  // Traitement de chaque réponse
  question.reponses.forEach((reponse: any, index: number) => {
    const reponseId = reponse.id || reponse._id?.$oid || index.toString();
    const userSelected = answers.includes(index);
    const isCorrectAnswer = reponse.est_correcte === true || reponse['est_correctه'] === true;

    // Avertissement si pas de valeur de correction définie
    if (reponse.est_correcte === undefined && reponse['est_correctه'] === undefined) {
      console.warn(`Response ${reponse.texte_reponse} in question ${questionId} has no est_correcte or est_correctه value`);
    }

    // Ajout à la soumission
    submission.answers.push({
      reponseId,
      texte_reponse: reponse.texte_reponse,
      userSelected
    });

    // Comptage des réponses correctes/incorrectes sélectionnées
    if (userSelected) {
      if (isCorrectAnswer) {
        correctCount++;
        console.log(`Response ${reponse.texte_reponse}: Correct, selected correctly`);
      } else {
        incorrectCount++;
        console.log(`Response ${reponse.texte_reponse}: Incorrect, selected but not correct`);
      }
    } else if (isCorrectAnswer) {
      missedCorrectCount++;
      console.log(`Response ${reponse.texte_reponse}: Missed correct answer`);
    }
  });

  // Logique de scoring (seulement si toutes les options ne sont pas sélectionnées)
  if (totalSelectedAnswers === totalOptions) {
    // Toutes les options sélectionnées = 0
    score = 0;
  } else if (totalSelectedAnswers === 0) {
    // Aucune réponse sélectionnée
    score = 0;
  } else if (totalCorrectResponses === 1) {
    // Question à une seule réponse correcte
    if (totalSelectedAnswers === 1 && correctCount === 1 && incorrectCount === 0) {
      // Une seule réponse sélectionnée ET c'est la bonne
      score = 1;
    } else {
      // Plus d'une réponse sélectionnée OU réponse incorrecte sélectionnée
      score = 0;
    }
  } else {
    // Question à réponses multiples - système de pénalités
    score = 1; // Commencer avec le score complet
    
    // Pénalité pour chaque réponse correcte manquée
    if (missedCorrectCount > 0) {
      const penalty = missedCorrectCount * (1 / totalOptions);
      score -= penalty;
      console.log(`Penalty for ${missedCorrectCount} missed correct answers: -${penalty}`);
    }
    
    // Pénalité pour chaque réponse incorrecte sélectionnée
    if (incorrectCount > 0) {
      const penalty = incorrectCount * (1 / totalOptions);
      score -= penalty;
      console.log(`Penalty for ${incorrectCount} incorrect answers selected: -${penalty}`);
    }
    
    // S'assurer que le score ne descend pas en dessous de 0
    score = Math.max(0, score);
  }

  submission.score = score;

  console.log('QCM submission:', {
    questionId,
    score,
    possibleScore,
    correctCount,
    incorrectCount,
    missedCorrectCount,
    totalCorrectResponses,
    totalSelectedAnswers,
    totalOptions,
    allOptionsSelected: totalSelectedAnswers === totalOptions,
    answers: submission.answers
  });

  return {
    score,
    possibleScore,
    unanswered: unansweredCount,
    submission
  };
}
// 2. CORRECTION POUR VRAI_FAUX - Méthode de scoring

private handleTrueFalseQuestion(question: any): { score: number, possibleScore: number, unanswered: number, submission: any } {
  const questionId = question._id?.$oid || question.id;
  const answers = this.multiTrueFalseAnswers[questionId] || {};
  let score = 0;
  const possibleScore = 1;
  let unansweredCount = 0;
  let correctCount = 0;
  const totalResponses = question.reponses?.length || 0;

  const submission = {
    questionId,
    type: 'VRAI_FAUX',
    responses: [] as Array<{
      reponseId: string;
      texte_reponse: string;
      userAnswer: boolean | null;
    }>,
    score: 0,
    possibleScore
  };

  if (totalResponses === 0) {
    console.warn(`Question ${questionId} has no responses defined`);
    return { score: 0, possibleScore, unanswered: 1, submission };
  }

  question.reponses.forEach((reponse: any, index: number) => {
    const userAnswer = answers[index];
    const reponseId = reponse.id || reponse._id?.$oid || index.toString();
    const correctAnswer = reponse.est_correcte; // Ensure this is a boolean
    const isCorrect = userAnswer !== null && userAnswer !== undefined && userAnswer === correctAnswer;

    submission.responses.push({
      reponseId,
      texte_reponse: reponse.texte_reponse,
      userAnswer
    });

    if (userAnswer === null || userAnswer === undefined) {
      unansweredCount++;
      console.log(`Response ${reponse.texte_reponse}: No answer provided`);
    } else if (isCorrect) {
      correctCount++;
      console.log(`Response ${reponse.texte_reponse}: Correct, userAnswer=${userAnswer}, correct=${correctAnswer}, +${1/totalResponses} points`);
    } else {
      console.log(`Response ${reponse.texte_reponse}: Incorrect, userAnswer=${userAnswer}, correct=${correctAnswer}`);
    }
  });

  score = totalResponses > 0 ? (correctCount / totalResponses) : 0;
  submission.score = score;

  console.log('VRAI_FAUX submission:', {
    questionId,
    score,
    possibleScore,
    correctCount,
    totalResponses,
    responses: submission.responses
  });

  return {
    score,
    possibleScore,
    unanswered: unansweredCount === totalResponses ? 1 : 0,
    submission
  };
}

private handleMultiTrueFalseQuestion(question: any): { score: number, possibleScore: number, unanswered: number, submission: any } {
  const questionId = question._id?.$oid || question.id;
  const answers = this.multiTrueFalseAnswers[questionId] || {};
  let score = 0;
  const possibleScore = 1;
  let unansweredCount = 0;
  let correctCount = 0;
  const totalOptions = question.options?.length || 0;

  const submission = {
    questionId,
    type: 'MULTI_VRAI_FAUX',
    responses: [] as Array<{
      optionId: string;
      texte_option: string;
      userAnswer: boolean | null;
    }>,
    score: 0,
    possibleScore
  };

  if (totalOptions === 0) {
    console.warn(`Question ${questionId} has no options defined`);
    return { score: 0, possibleScore, unanswered: 1, submission };
  }

  question.options.forEach((option: any, index: number) => {
    const userAnswer = answers[index];
    const optionId = option.id || option._id?.$oid || index.toString();
    const correctAnswer = option.est_correcte; // Ensure this is a boolean
    const isCorrect = userAnswer !== null && userAnswer !== undefined && userAnswer === correctAnswer;

    submission.responses.push({
      optionId,
      texte_option: option.texte_option,
      userAnswer
    });

    if (userAnswer === null || userAnswer === undefined) {
      unansweredCount++;
      console.log(`Option ${option.texte_option}: No answer provided`);
    } else if (isCorrect) {
      correctCount++;
      console.log(`Option ${option.texte_option}: Correct, userAnswer=${userAnswer}, correct=${correctAnswer}, +${1/totalOptions} points`);
    } else {
      console.log(`Option ${option.texte_option}: Incorrect, userAnswer=${userAnswer}, correct=${correctAnswer}`);
    }
  });

  score = totalOptions > 0 ? (correctCount / totalOptions) : 0;
  submission.score = score;

  console.log('MULTI_VRAI_FAUX submission:', {
    questionId,
    score,
    possibleScore,
    correctCount,
    totalOptions,
    responses: submission.responses
  });

  return {
    score,
    possibleScore,
    unanswered: unansweredCount === totalOptions ? 1 : 0,
    submission
  };
}
// 3. CORRECTION POUR MULTI_VRAI_FAUX - Méthode de scoring


private handleAppariementQuestion(question: any): {
  score: number;
  possibleScore: number;
  unanswered: number;
  submission: any;
} {
  const questionId = question._id?.$oid || question.id;
  const answers: { [key: string]: any[] } = this.matchingAnswers[questionId] || {};
  let score = 0;
  const possibleScore = 1;
  let unansweredCount = 0;
  let correctCount = 0;
  let totalMatches = 0;

  const submission = {
    questionId,
    type: 'APPARIEMENT',
    answers: { ...answers },
    score: 0,
    possibleScore,
  };

  if (!question.correspondances || question.correspondances.length === 0) {
    console.warn(`Question ${questionId} has no correspondences defined`);
    return { score: 0, possibleScore, unanswered: 1, submission };
  }

  // Calculate total matches
  question.correspondances.forEach((corr: any) => {
    const correctIds = Array.isArray(corr.droite_id) ? corr.droite_id : [corr.droite_id];
    totalMatches += correctIds.length;
  });

  question.correspondances.forEach((corr: any) => {
    const rawUserAnswers = answers[corr.gauche_id] || [];
    const userAnswers: string[] = rawUserAnswers.map((a) => String(a));
    const correctIds = Array.isArray(corr.droite_id) ? corr.droite_id : [corr.droite_id];

    // Check if all answers are empty
    const isAllEmpty = userAnswers.every((ans: string) => !ans || ans.trim() === '');

    if (isAllEmpty) {
      unansweredCount += correctIds.length;
    }

    // Compare user answers with correct IDs
    correctIds.forEach((correctId: any, index: number) => {
      const userAnswer = userAnswers[index];

      if (!userAnswer || userAnswer.trim() === '') {
        console.log(`Match ${corr.gauche_id}[${index + 1}]: No answer provided`);
        unansweredCount++;
      } else if (userAnswer === String(correctId)) {
        correctCount++;
        console.log(`Match ${corr.gauche_id}[${index + 1}]: Correct, +${1 / totalMatches} points`);
      } else {
        console.log(
          `Match ${corr.gauche_id}[${index + 1}]: Incorrect, answer=${userAnswer}, expected=${correctId}`
        );
      }
    });
  });

  score = totalMatches > 0 ? correctCount / totalMatches : 0;
  submission.score = score;

  console.log('APPARIEMENT submission:', {
    questionId,
    score,
    possibleScore,
    correctCount,
    totalMatches,
    answers,
  });

  return {
    score,
    possibleScore,
    unanswered: unansweredCount === totalMatches ? 1 : 0,
    submission,
  };
}
// 5. CORRECTION POUR L'INITIALISATION - Méthode initializeQuestionAnswers
private initializeQuestionAnswers(question: any): void {
  const questionId = question._id?.$oid || question.id || '';
  if (!questionId) {
    console.error('ID de question manquant', question);
    return;
  }

  switch (question.type.toUpperCase()) {
    case 'QCM':
      this.userAnswers[questionId] = [];
      break;

    case 'LIBRE':
      this.libreAnswers[questionId] = '';
      break;

    case 'ORDONNER':
      this.userOrder[questionId] = {};
      question.etapes?.forEach((etape: any) => {
        this.userOrder[questionId][etape.texte_etape] = 0;
      });
      break;

    case 'APPARIEMENT':
      this.matchingAnswers[questionId] = {};
      question.options_gauche?.forEach((gauche: any) => {
        const correspondance = question.correspondances.find((c: any) => c.gauche_id == gauche.id);
        const inputCount = correspondance ? (Array.isArray(correspondance.droite_id) ? correspondance.droite_id.length : 1) : 1;
        this.matchingAnswers[questionId][gauche.id] = new Array(inputCount).fill('');
      });
      break;

    case 'ESPACES_VIDES':
      question.espaces?.forEach((espace: any) => {
        this.blankAnswers[`${questionId}_${espace.position}`] = '';
      });
      break;

    case 'MULTI_VRAI_FAUX':
    case 'VRAI_FAUX':
      this.multiTrueFalseAnswers[questionId] = {};
      const options = question.options || question.reponses || [];
      options.forEach((opt: any, index: number) => {
        this.multiTrueFalseAnswers[questionId][index] = null;
      });
      break;

    default:
      console.warn(`Type de question non reconnu: ${question.type}`);
      break;
  }
}

// 6. MÉTHODES POUR APPARIEMENT - À ajouter dans votre composant
hasMultipleInputs(question: any, gauche: any): boolean {
  const correspondance = question.correspondances.find((c: any) => c.gauche_id == gauche.id);
  return correspondance && Array.isArray(correspondance.droite_id) && correspondance.droite_id.length > 1;
}

getInputIndices(question: any, gauche: any): number[] {
  const correspondance = question.correspondances.find((c: any) => c.gauche_id == gauche.id);
  const inputCount = correspondance ? (Array.isArray(correspondance.droite_id) ? correspondance.droite_id.length : 1) : 1;
  return Array.from({ length: inputCount }, (_, i) => i + 1);
}

getInputValue(question: any, gauche: any, inputIndex: number): string {
  const questionId = question._id?.$oid || question.id;
  const answers = this.matchingAnswers[questionId] || {};
  const gaucheAnswers = answers[gauche.id] || [];
  return gaucheAnswers[inputIndex - 1] || '';
}

updateInputValue(question: any, gauche: any, inputIndex: number, value: string): void {
  const questionId = question._id?.$oid || question.id;
  
  if (!this.matchingAnswers[questionId]) {
    this.matchingAnswers[questionId] = {};
  }
  
  if (!this.matchingAnswers[questionId][gauche.id]) {
    const correspondance = question.correspondances.find((c: any) => c.gauche_id == gauche.id);
    const inputCount = correspondance ? (Array.isArray(correspondance.droite_id) ? correspondance.droite_id.length : 1) : 1;
    this.matchingAnswers[questionId][gauche.id] = new Array(inputCount).fill('');
  }
  
  this.matchingAnswers[questionId][gauche.id][inputIndex - 1] = value;
  
  console.log(`Updated appariement answer:`, {
    questionId,
    gaucheId: gauche.id,
    inputIndex,
    value,
    allAnswers: this.matchingAnswers[questionId][gauche.id]
  });
}

// 7. MÉTHODES POUR MULTI_VRAI_FAUX ET VRAI_FAUX - Déjà existantes mais à vérifier
getMultiTrueFalseAnswer(question: any, index: number): boolean | null {
  const questionId = question._id?.$oid || question.id;
  const answer = this.multiTrueFalseAnswers[questionId]?.[index];
  return answer !== null && answer !== undefined ? answer : null;
}

updateMultiTrueFalseAnswer(question: any, index: number, value: boolean): void {
  const questionId = question._id?.$oid || question.id;
  if (!this.multiTrueFalseAnswers[questionId]) {
    this.multiTrueFalseAnswers[questionId] = {};
  }
  this.multiTrueFalseAnswers[questionId][index] = value;
  console.log(`Updated ${question.type} answer:`, {
    questionId,
    index,
    value,
    allAnswers: this.multiTrueFalseAnswers[questionId]
  });
}
}