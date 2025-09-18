import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SearchResult {
  modelName: string;
  image: string;
  expectations: string[];
  time: string;
  englishName: string;
  arabicName: string;
  day?: string;
  hasVideos?: boolean;
  videoCount?: number;
}

export interface ModelInfo {
  expectations: string[];
  time: string;
}

export interface DayExpectationsMap {
  [key: string]: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  search(query: string) {
    throw new Error('Method not implemented.');
  }
  private searchResultsSubject = new BehaviorSubject<SearchResult[]>([]);
  public searchResults$: Observable<SearchResult[]> = this.searchResultsSubject.asObservable();

  private searchTermSubject = new BehaviorSubject<string>('');
  public searchTerm$: Observable<string> = this.searchTermSubject.asObservable();

  // Données des modèles (copiées depuis support-list)
  private modelInfos: { [key: string]: ModelInfo } = {
    'code of conduct': { 
      expectations: ['To Learn about local internal rules, regional code of conduct, conflict of interest - bribery politic\nالتعرف على القوانين الداخلية المحلية، مدونة السلوك الإقليمية، تضارب المصالح - الرشوة والسياسة'], 
      time: '1h00' 
    },
    'type of contracts': { 
      expectations: ['To Learn about local types of contracts\nالتعرف على أنواع العقود المحلية'], 
      time: '5 min' 
    },
    'General Affairs': { 
      expectations: ['To Learn about general affairs duties and rights: working hour, canteen, cloakroom, mosque\nالتعرف على واجبات وحقوق الشؤون العامة: ساعات العمل، المقصف، غرفة تبديل الملابس، المسجد'], 
      time: '10 min' 
    },
    'health insurance': { 
      expectations: ['Understand health insurance coverage\nفهم تغطية التأمين الصحي', 'Know how to submit claims\nمعرفة كيفية تقديم المطالبات', 'Know specific benefits\nمعرفة المزايا الخاصة'], 
      time: '15min' 
    },
    'cnss': { 
      expectations: ['To Learn about local social security fund\nالتعرف على صندوق الضمان الاجتماعي المحلي'], 
      time: '5 min' 
    },
    'welcome': { 
      expectations: ['To ice-break the first contact with introduction of trainer and trainees\nلكسر الحاجز في اللقاء الأول مع تقديم المدرب والمتدربين'], 
      time: '15 min' 
    },
    'key messages': { 
      expectations: ['To Have key messages of each module in booklet in which trainee can add notes\nالحصول على الرسائل الرئيسية لكل وحدة في كتيب يمكن للمتدرب تدوين الملاحظات فيه'], 
      time: '5min' 
    },
    'company Context': { 
      expectations: ['To Know about Yazaki worldwide, history, policy, values and actual company\nالتعرف على شركة Yazaki على المستوى العالمي، تاريخها، سياساتها، قيمها والشركة الحالية'], 
      time: '45 min' 
    },
    'Added value of operator': { 
      expectations: ['To Feel the importance of trainee in society as producer of all cars WH\nالإحساس بأهمية المتدرب في المجتمع كمنتج'], 
      time: '45 min' 
    },
    'health and safety': { 
      expectations: ['To Learn about Health and Safety overview and general consigns\nالتعرف على نظرة عامة حول الصحة والسلامة والتعليمات العامة', 'To Learn about Health and Safety IPE in showcase\nالتعرف على معدات الحماية الفردية في عرض خاص'], 
      time: '2h50min' 
    },
    'WH Production Flow': { 
      expectations: ['To Learn overall WH manufacturing Flow from Supplier to customer including WH mounting car\nالتعرف على تدفق تصنيع الضفائر من المورد إلى الزبون بما في ذلك تركيبها في السيارة', 'To See where and how exactly the WH is mounted on the car\nمعرفة أين وكيف يتم تركيب الضفيرة في السيارة', 'To observe overall manufacturing flow in real areas\nملاحظة تدفق التصنيع الفعلي في المناطق الحقيقية'], 
      time: '1h35min' 
    },
    'Good car comes from good WH': { 
      expectations: ['To Feel the importance of quality in front of the final car driver\nالإحساس بأهمية الجودة أمام سائق السيارة النهائي'], 
      time: '5 min' 
    },
    '5 s': { 
      expectations: ['To Learn about 5S: what to do and what not do in workstation\nالتعرف على 5S: ما يجب وما لا يجب فعله في مكان العمل'], 
      time: '30 min' 
    },
    '7 Muda': { 
      expectations: ['To Learn about 7 Muda: what to do and what not do in workstation\nالتعرف على 7 أنواع من الهدر: ما يجب وما لا يجب فعله في مكان العمل'], 
      time: '1h10min' 
    },
    'Gemba Rules': { 
      expectations: ['To Learn about Gemba rules: what to do and what not do in shopfloor\nالتعرف على قواعد جيمبا: ما يجب وما لا يجب فعله في ورشة العمل', 'To Learn about different Yazaki uniforms, colors and purposes\nالتعرف على الزي الرسمي الخاص بـيازاكي، ألوانه واستخداماته المختلفة'], 
      time: '50min' 
    },
    'production process and material': { 
      expectations: ['To Learn about production flow process and material used for each step\nالتعرف على مراحل عملية الإنتاج والمواد المستخدمة في كل خطوة', 'To simulate and feel with touch the components used in production\nمحاكاة ولمس المكونات المستخدمة في الإنتاج'], 
      time: '1h40min' 
    },
    'YAZAKI Image': { 
      expectations: ['To Feel the importance of operator building Quality in front of Customer as YAZAKI image\nالإحساس بأهمية دور العامل في بناء الجودة أمام الزبون كصورة لشركة يازاكي'], 
      time: '5 min' 
    },
    'Andon': { 
      expectations: ['To Learn how to manage abnormalities in workstation using Andon tower\nالتعرف على كيفية التعامل مع الحالات غير الطبيعية في مكان العمل باستخدام برج اندون'], 
      time: '15 min' 
    },
    'Quality': { 
      expectations: ['To Learn about quality targets and different defects\nالتعرف على أهداف الجودة وأنواع العيوب المختلفة', 'To simulate and feel with touch top 4 defects in the plant\nمحاكاة ولمس أكثر 4 عيوب شيوعًا في المصنع'], 
      time: '30 min' 
    },
    'Environment': { 
      expectations: ['To Learn about Environment overview\nالتعرف على لمحة عامة عن البيئة'], 
      time: '1h50min' 
    },
    'Special processes': { 
      expectations: ['To Learn about special process in criticality on WH and car driver\nالتعرف على العمليات الخاصة وتأثيرها الحرج على الضفيرة وسائق السيارة'], 
      time: '45 min' 
    }
  };

  private modelImages: { [key: string]: string } = {
    'code of conduct': 'assets/images/code-of-conduct.jpg',
    'type of contracts': 'assets/images/type-of-contracts.jpg',
    'General Affairs': 'assets/images/general-affairs.jpg',
    'health insurance': 'assets/images/health-insurance.jpg',
    'cnss': 'assets/images/cnss.jpg',
    'welcome': 'assets/images/welcome.jpg',
    'key messages': 'assets/images/key-messages.jpg',
    'company Context': 'assets/images/company-context.jpg',
    'health and safety': 'assets/images/health&safety.jpg',
    'WH Production Flow': 'assets/images/wh-productionFlow.jpg',
    'Good car comes from good WH': 'assets/images/good-car.jpg',
    '5 s': 'assets/images/5s.jpg',
    '7 Muda': 'assets/images/7muda.webp',
    'Gemba Rules': 'assets/images/gemba.jpg',
    'production process and material': 'assets/images/production-process.jpg',
    'YAZAKI Image': 'assets/images/yazaki-image.png',
    'Andon': 'assets/images/andon.jpg',
    'Quality': 'assets/images/quality.jpg',
    'Environment': 'assets/images/env.jpg',
    'Special processes': 'assets/images/special-process.jpg',
    'Added value of operator': 'assets/images/added-value.jpg'
  };

  constructor() {}

  // Obtenir tous les noms de modèles
  getAllModelNames(): string[] {
    return Object.keys(this.modelInfos);
  }

  // Rechercher des modèles par nom
  searchModelsByName(searchTerm: string): string[] {
    if (!searchTerm.trim()) {
      return this.getAllModelNames();
    }
    
    const searchLower = searchTerm.toLowerCase();
    return this.getAllModelNames().filter(modelName => 
      modelName.toLowerCase().includes(searchLower)
    );
  }

  // Rechercher des modèles par objectif/expectation
  searchModelsByExpectation(searchTerm: string): string[] {
    if (!searchTerm.trim()) {
      return this.getAllModelNames();
    }
    
    const searchLower = searchTerm.toLowerCase();
    return this.getAllModelNames().filter(modelName => {
      const modelInfo = this.modelInfos[modelName];
      return modelInfo && modelInfo.expectations.some(expectation => 
        expectation.toLowerCase().includes(searchLower)
      );
    });
  }

  // Effectuer la recherche
  performSearch(searchTerm: string, searchType: 'name' | 'expectation' = 'name'): SearchResult[] {
    const term = searchTerm.trim();
    
    if (!term) {
      return [];
    }

    let foundModels: string[] = [];
    
    if (searchType === 'name') {
      foundModels = this.searchModelsByName(term);
    } else {
      foundModels = this.searchModelsByExpectation(term);
    }

    // Créer les résultats avec toutes les infos
    const results = foundModels.map(modelName => ({
      modelName,
      image: this.modelImages[modelName] || 'assets/images/default.jpg',
      expectations: this.modelInfos[modelName]?.expectations || [],
      time: this.modelInfos[modelName]?.time || '',
      englishName: this.getEnglishText(modelName),
      arabicName: this.getArabicText(modelName)
    }));

    this.searchResultsSubject.next(results);
    return results;
  }

  // Mettre à jour le terme de recherche
  updateSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  // Vider les résultats de recherche
  clearSearchResults(): void {
    this.searchResultsSubject.next([]);
    this.searchTermSubject.next('');
  }

  // Méthodes utilitaires pour le texte bilingue
  private splitBilingualText(text: string): [string, string] {
    if (!text) return ['', ''];
    const parts = text.split('\n').map(s => s.trim());
    return [parts[0] || '', parts[1] || ''];
  }

  private getEnglishText(text: string): string {
    return this.splitBilingualText(text)[0];
  }

  private getArabicText(text: string): string {
    return this.splitBilingualText(text)[1];
  }

  // Obtenir les informations d'un modèle spécifique
  getModelInfo(modelName: string): ModelInfo | undefined {
    return this.modelInfos[modelName];
  }

  // Obtenir l'image d'un modèle
  getModelImage(modelName: string): string {
    return this.modelImages[modelName] || 'assets/images/default.jpg';
  }
}