export interface QuestionTranslation {
  id: string;
  english: string;
  arabic: string;
  category: string;
}

export interface OptionTranslation {
  english: string;
  arabic: string;
}

export class TranslationService {
  
  private questionTranslations: QuestionTranslation[] = [
    // Code de Conduite et Éthique
    {
      id: 'workplace_behavior',
      english: 'What should you do if you witness inappropriate behavior in the workplace?',
      arabic: 'ماذا يجب أن تفعل إذا شاهدت سلوكًا غير لائق في مكان العمل؟',
      category: 'ethics'
    },
    {
      id: 'company_resources',
      english: 'Is it allowed to use company resources for personal purposes?',
      arabic: 'هل يُسمح باستخدام موارد الشركة لأغراض شخصية؟',
      category: 'ethics'
    },
    {
      id: 'confidential_info',
      english: 'Can an employee share confidential information for non-professional purposes?',
      arabic: 'يمكن للموظف مشاركة معلومات سرية لأغراض غير مهنية؟',
      category: 'ethics'
    },
    {
      id: 'code_violation',
      english: 'In case of a code of conduct violation',
      arabic: 'في حالة انتهاك مدونة السلوك',
      category: 'ethics'
    },
    
    // Qualité et Production
    {
      id: 'quality_depends',
      english: 'Good quality depends on',
      arabic: 'الجودة العالية تعتمد على',
      category: 'quality'
    },
    {
      id: 'defect_contact',
      english: 'When a defect is detected, it is important to contact',
      arabic: 'عند اكتشاف عيب، من المهم التواصل مع',
      category: 'quality'
    },
    {
      id: 'production_element',
      english: 'What is the main element in production?',
      arabic: 'ما هو العنصر الرئيسي في الإنتاج؟',
      category: 'production'
    },
    {
      id: 'customer_requirements',
      english: 'What are the customer\'s requirements for the product?',
      arabic: 'ما هي متطلبات العميل للمنتج؟',
      category: 'quality'
    },
    {
      id: 'drawing_comparison',
      english: 'What is the workplace where the comparison with the drawing is done?',
      arabic: 'ما هو مكان العمل الذي يتم فيه المقارنة مع الرسم؟',
      category: 'quality'
    },
    
    // Organisation et 5S
    {
      id: 'workplace_organization',
      english: 'Organizing my workplace',
      arabic: 'تنظيم مكان عملي',
      category: 'organization'
    },
    {
      id: 'five_s_meaning',
      english: 'What does "5S" mean?',
      arabic: 'ماذا تعني "5S"؟',
      category: 'organization'
    },
    
    // Sécurité et Règlements
    {
      id: 'changing_rooms',
      english: 'Can changing rooms be used to change clothes before and after the shift?',
      arabic: ' يمكن استخدام غرف تغيير الملابس قبل وبعد الخروج',
      category: 'safety'
    },
    {
      id: 'smoking_policy',
      english: 'Is smoking allowed inside the company?',
      arabic: ' التدخين مسموح داخل الشركة؟',
      category: 'safety'
    },
    {
      id: 'production_restrictions',
      english: 'What is not allowed in production areas?',
      arabic: 'ما الذي لا يُسمح به في مناطق الإنتاج؟',
      category: 'safety'
    },
    {
      id: 'danger_button',
      english: 'In case of danger, which button should be pressed?',
      arabic: 'في حالة الخطر، أي زر يجب الضغط عليه؟',
      category: 'safety'
    },
    
    // Présence et Contrats
    {
      id: 'unexcused_absence',
      english: 'Unexcused absence is considered unjustified',
      arabic: 'الغياب غير المبرر يعتبر غير مشروع',
      category: 'attendance'
    },
    {
      id: 'attendance_confirmation',
      english: 'To confirm attendance, it is necessary to check in and out',
      arabic: 'لتأكيد الحضور، من الضروري تسجيل الدخول والخروج',
      category: 'attendance'
    },
    {
      id: 'contract_types',
      english: 'What types of contracts are applied at Yazaki?',
      arabic: 'ما هي أنواع العقود المطبقة في يازاكي؟',
      category: 'contracts'
    },
    {
      id: 'deductions_start',
      english: 'When do deductions start for an employee?',
      arabic: 'متى تبدأ الخصومات للموظف؟',
      category: 'contracts'
    },
    
    // Matériaux et Équipements
    {
      id: 'prohibited_materials',
      english: 'What materials are prohibited?',
      arabic: 'ما هي المواد المحظورة؟',
      category: 'materials'
    },
    {
      id: 'cable_components',
      english: 'What are the components of a cable?',
      arabic: 'ما هي مكونات الكابل؟',
      category: 'materials'
    },
    {
      id: 'business_operations',
      english: 'What are Yazaki\'s business operations?',
      arabic: 'ما هي عمليات يازاكي التجارية؟',
      category: 'business'
    },
    {
      id: 'waste_blue_bin',
      english: 'What type of waste is placed in the blue bin?',
      arabic: 'ما نوع النفايات التي توضع في الحاوية الزرقاء؟',
      category: 'environment'
    },
    
    // Transport et Services
    {
      id: 'transport_rules',
      english: 'What transport rules must be followed?',
      arabic: 'ما هي قواعد النقل التي يجب اتباعها؟',
      category: 'transport'
    },
    {
      id: 'overtime_hours',
      english: 'What are the overtime work hours?',
      arabic: 'ما هي ساعات العمل الإضافي؟',
      category: 'schedule'
    },
    {
      id: 'health_insurance',
      english: 'What is the type of health insurance at Yazaki?',
      arabic: 'ما نوع التأمين الصحي في يازاكي؟',
      category: 'benefits'
    },
    {
      id: 'canteen_policy',
      english: 'What is the internal policy for the canteen?',
      arabic: 'ما هي السياسة الداخلية للمقصف؟',
      category: 'services'
    },
    
    // Philosophie et Incidents
    {
      id: 'yazaki_philosophy',
      english: 'What is Yazaki\'s philosophy?',
      arabic: 'ما هي فلسفة يازاكي؟',
      category: 'philosophy'
    },
    {
      id: 'incident_consequences',
      english: 'What did the incident cause to the factory?',
      arabic: 'ماذا تسبب الحادث للمصنع؟',
      category: 'incidents'
    }
  ];

  private optionTranslations: OptionTranslation[] = [
    // Options communes
    { english: 'True', arabic: 'صحيح' },
    { english: 'False', arabic: 'خطأ' },
    { english: 'Nothing', arabic: 'لا شيء' },
    { english: 'Do nothing', arabic: 'لا تفعل شيئًا' },
    
    // Options spécifiques - Comportement au travail
    { english: 'Ignore the situation', arabic: 'تجاهل الموقف' },
    { english: 'Report the behavior to the supervisor or HR', arabic: 'الإبلاغ عن السلوك للمشرف أو الموارد البشرية' },
    { english: 'Participate in the inappropriate behavior', arabic: 'المشاركة في السلوك غير اللائق' },
    
    // Options spécifiques - Qualité
    { english: 'Verification', arabic: 'التحقق' },
    { english: 'Quality manager', arabic: 'مدير الجودة' },
    { english: 'Multitasker', arabic: 'متعدد المهام' },
    { english: 'High quality', arabic: 'جودة عالية' },
    { english: 'Shipping and delivery on time', arabic: 'الشحن والتسليم في الوقت المحدد' },
    
    // Options spécifiques - Organisation
    { english: 'Makes my work easier', arabic: 'يجعل عملي أسهل' },
    { english: 'Complicates my work', arabic: 'يعقد عملي' },
    
    // Options spécifiques - 5S
    { english: 'Health / Be yourself / Worthless / Stop / Supernatural', arabic: 'الصحة / كن نفسك / عديم القيمة / توقف / خارق للطبيعة' },
    { english: 'Seiso (Clean) / Seiketsu (Standardize) / Seiton (Organize) / Seiri (Sort) / Shitsuke (Sustain)', arabic: 'سيسو (نظف) / سيكيتسو (قياسي) / سيتون (نظم) / سيري (رتب) / شيتسوكي (حافظ)' },
    
    // Options spécifiques - Production
    { english: 'Equipment', arabic: 'المعدات' },
    { english: 'Worker', arabic: 'العامل' },
    { english: 'Production', arabic: 'الإنتاج' },
    
    // Options spécifiques - Vêtements et sécurité
    { english: 'Short pants', arabic: 'السراويل القصيرة' },
    { english: 'High-heeled shoes', arabic: 'الأحذية عالية الكعب' },
    { english: 'Official uniform', arabic: 'الزي الرسمي' },
    
    // Options spécifiques - Matériaux
    { english: 'Toxic materials', arabic: 'المواد السامة' },
    { english: 'Gambling items', arabic: 'أدوات القمار' },
    { english: 'Food', arabic: 'الطعام' },
    
    // Options spécifiques - Câbles
    { english: 'Electrical wire', arabic: 'السلك الكهربائي' },
    { english: 'Terminal', arabic: 'الطرف' },
    { english: 'Connector', arabic: 'الموصل' },
    { english: 'Frame', arabic: 'الإطار' },
    
    // Options spécifiques - Contrats
    { english: 'Vocational training contract (CFA)', arabic: 'عقد التدريب المهني (CFA)' },
    { english: 'Employment contract (ANAPEC)', arabic: 'عقد العمل (ANAPEC)' },
    { english: 'Permanent contract (CDI)', arabic: 'عقد دائم (CDI)' },
    { english: 'Summer internship contract', arabic: 'عقد تدريب صيفي' },
    { english: 'CFA', arabic: 'CFA' },
    { english: 'Anapec', arabic: 'ANAPEC' },
    { english: 'CDI/CDD', arabic: 'CDI/CDD' },
    
    // Options spécifiques - Transport
    { english: 'Respect pickup points', arabic: 'احترام نقاط التجميع' },
    { english: 'Talk to the driver', arabic: 'التحدث مع السائق' },
    { english: 'Maintain bus cleanliness', arabic: 'الحفاظ على نظافة الحافلة' },
    
    // Options spécifiques - Horaires
    { english: 'From 6:00 AM to 4:00 PM', arabic: 'من 6:00 صباحًا إلى 4:00 مساءً' },
    { english: 'From 10:00 AM to 2:00 PM', arabic: 'من 10:00 صباحًا إلى 2:00 مساءً' },
    { english: 'From 6:00 PM to 6:00 AM', arabic: 'من 6:00 مساءً إلى 6:00 صباحًا' },
    
    // Options spécifiques - Assurance
    { english: 'Wafa Assurance', arabic: 'وفا للتأمين' },
    { english: 'Sanlam Assurance', arabic: 'سانلام للتأمين' },
    { english: 'Axa Maroc', arabic: 'أكسا المغرب' },
    
    // Options spécifiques - Cantine
    { english: 'Adhere to the designated time for each group', arabic: 'الالتزام بالوقت المحدد لكل مجموعة' },
    { english: 'Respect the queue for selecting meals', arabic: 'احترام الطابور لاختيار الوجبات' },
    { english: 'Pass through the payment counter without presenting the work badge', arabic: 'المرور عبر منضدة الدفع دون تقديم بطاقة العمل' },
    
    // Options spécifiques - Opérations commerciales
    { english: 'Electrical wires', arabic: 'الأسلاك الكهربائية' },
    { english: 'Charging connectors', arabic: 'موصلات الشحن' },
    { english: 'Safety equipment', arabic: 'معدات السلامة' },
    
    // Options spécifiques - Philosophie
    { english: 'Everyone for the individual and the individual for the individual', arabic: 'الجميع للفرد والفرد للفرد' },
    { english: 'The individual for everyone and everyone for the individual', arabic: 'الفرد للجميع والجميع للفرد' },
    { english: 'The individual for the individual', arabic: 'الفرد للفرد' },
    
    // Options spécifiques - Violation du code
    { english: 'Discuss with your direct supervisor', arabic: 'ناقش مع المشرف المباشر' },
    { english: 'Report to HR', arabic: 'أبلغ الموارد البشرية' },
    { english: 'Keep silent about the violation', arabic: 'اصمت عن الانتهاك' },
    
    // Options spécifiques - Qualité workplace
    { english: 'Mur Qualite', arabic: 'جدار الجودة    MUR QUALITY' },
    { english: 'Clip Checker', arabic: 'فاحص المشبك   CLIP CHECKER' },
    { english: 'Test Electrique', arabic: 'اختبار كهربائي  TEST ELECTRIQUE' },
    
    // Options spécifiques - Incidents
    { english: 'Loss of trust in the factory', arabic: 'فقدان الثقة في المصنع' },
    { english: 'Nothing happened', arabic: 'لم يحدث شيء' },
    { english: 'Reduction in Mr. A\'s salary', arabic: 'تخفيض راتب السيد أ' },
    
    // Options spécifiques - Boutons d'urgence
    { english: 'Green', arabic: 'الأخضر' },
    { english: 'Red', arabic: 'الأحمر' },
    { english: 'Yellow', arabic: 'الأصفر' },
    
    // Options spécifiques - Déchets
    { english: 'Paper', arabic: 'الورق' },
    { english: 'Plastic', arabic: 'البلاستيك' },
    { english: 'Organic materials', arabic: 'المواد العضوية' }
  ];

  /**
   * Traduit une question de l'anglais vers l'arabe
   */
  translateQuestion(englishQuestion: string): string {
    const translation = this.questionTranslations.find(
      t => t.english.toLowerCase() === englishQuestion.toLowerCase()
    );
    return translation ? translation.arabic : englishQuestion;
  }

  /**
   * Traduit une option de l'anglais vers l'arabe
   */
  translateOption(englishOption: string): string {
    const translation = this.optionTranslations.find(
      t => t.english.toLowerCase() === englishOption.toLowerCase()
    );
    return translation ? translation.arabic : englishOption;
  }

  /**
   * Traduit un tableau d'options
   */
  translateOptions(englishOptions: string[]): string[] {
    return englishOptions.map(option => this.translateOption(option));
  }

  /**
   * Traduit une question complète avec ses options
   */
  translateQuestionWithOptions(question: {
    text: string;
    options: string[];
    correct_answer: string[];
  }): {
    text: string;
    options: string[];
    correct_answer: string[];
  } {
    return {
      text: this.translateQuestion(question.text),
      options: this.translateOptions(question.options),
      correct_answer: this.translateOptions(question.correct_answer)
    };
  }

  /**
   * Obtient toutes les traductions par catégorie
   */
  getTranslationsByCategory(category: string): QuestionTranslation[] {
    return this.questionTranslations.filter(t => t.category === category);
  }

  /**
   * Obtient toutes les catégories disponibles
   */
  getAvailableCategories(): string[] {
    return [...new Set(this.questionTranslations.map(t => t.category))];
  }

  /**
   * Vérifie si une traduction existe pour une question donnée
   */
  hasTranslation(englishQuestion: string): boolean {
    return this.questionTranslations.some(
      t => t.english.toLowerCase() === englishQuestion.toLowerCase()
    );
  }

  /**
   * Ajoute une nouvelle traduction
   */
  addTranslation(translation: QuestionTranslation): void {
    if (!this.hasTranslation(translation.english)) {
      this.questionTranslations.push(translation);
    }
  }

  /**
   * Met à jour une traduction existante
   */
  updateTranslation(id: string, updatedTranslation: Partial<QuestionTranslation>): boolean {
    const index = this.questionTranslations.findIndex(t => t.id === id);
    if (index !== -1) {
      this.questionTranslations[index] = { ...this.questionTranslations[index], ...updatedTranslation };
      return true;
    }
    return false;
  }
}

// Exemple d'utilisation dans le composant
export class QuestionTranslationHelper {
  constructor(private translationService: TranslationService) {}

  /**
   * Traite les questions récupérées de la base de données
   */
  processQuestionsFromDatabase(questions: any[]): any[] {
    return questions.map(question => {
      const translatedQuestion = this.translationService.translateQuestionWithOptions({
        text: question.text,
        options: JSON.parse(question.options),
        correct_answer: JSON.parse(question.correct_answer)
      });

      return {
        ...question,
        text: translatedQuestion.text,
        options: JSON.stringify(translatedQuestion.options),
        correct_answer: JSON.stringify(translatedQuestion.correct_answer),
        original_text: question.text, // Garde l'original pour référence
        is_translated: true
      };
    });
  }
}