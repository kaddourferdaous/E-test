import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../auth.service';

interface DayExpectationsMap {
  [key: string]: string[];
}

interface ModelInfo {
  expectations: string[];
  time: string;
}

@Component({
  selector: 'app-support-list',
  templateUrl: './support-list.component.html',
  styleUrls: ['./support-list.component.css']
})
export class SupportListComponent implements OnInit {
  // Variables de cache static pour persister les données
  private static cachedMetadata: any[] | null = null;
  private static cachedGroupedMetadata: Record<string, Record<string, any[]>> | null = null;
  private static lastFetchTime: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

  allMetadata: any[] = [];
  groupedMetadata: Record<string, Record<string, any[]>> = {};
  expandedModel: string | null = null;
  expandedExpectation: string | null = null;
  displayedDays: string[] = [];
  errorMessage: string = '';
  loading: boolean = false;
  searchTerm: string = '';
  isSearchActive: boolean = false;
  filteredMetadata: any = {};
  searchType: 'name' | 'expectation' = 'name';
  allSearchResults: any[] = [];
  isLoading: boolean = false; // Changé à false par défaut
  loadingMessage: string = 'Chargement des cours...';
  showSkeleton: boolean = false; // Changé à false par défaut
  filteredGroupedMetadata: Record<string, Record<string, any[]>> = {};
  originalGroupedMetadata: Record<string, Record<string, any[]>> = {};
  modelDetailsCache: { [key: string]: any[] } = {};
  
  private apiUrl = 'https://training-backend-1pda.onrender.com';
  
  dayExpectations: DayExpectationsMap = {
    '0': ['To inform trainee about duties and rights\nإعلام المتدرب بالواجبات والحقوق'],
    '1': ['To inform trainee about work environment and his important role inside Yazaki\nإعلام المتدرب ببيئة العمل ودوره الهام داخل يازاكي'],
    '2': ['To learn overall production steps, quality importance and workstation rules\nتعلم خطوات الإنتاج العامة، أهمية الجودة وقواعد العمل في المحطة']
  };

  modelInfos: { [key: string]: ModelInfo } = {
    'code of conduct': { expectations: ['To Learn about local internal rules, regional code of conduct, conflict of interest - bribery politic\nالتعرف على القوانين الداخلية المحلية، مدونة السلوك الإقليمية، تضارب المصالح - الرشوة والسياسة'], time: '1h00' },
    'type of contracts': { expectations: ['To Learn about local types of contracts\nالتعرف على أنواع العقود المحلية'], time: '5 min' },
    'General Affairs': { expectations: ['To Learn about general affairs duties and rights: working hour, canteen, cloakroom, mosque\nالتعرف على واجبات وحقوق الشؤون العامة: ساعات العمل، المقصف، غرفة تبديل الملابس، المسجد'], time: '10 min' },
    'health insurance': { expectations: ['Understand health insurance coverage\nفهم تغطية التأمين الصحي', 'Know how to submit claims\nمعرفة كيفية تقديم المطالبات', 'Know specific benefits\nمعرفة المزايا الخاصة'], time: '15min' },
    'cnss': { expectations: ['To Learn about local social security fund\nالتعرف على صندوق الضمان الاجتماعي المحلي'], time: '5 min' },
    'welcome': { expectations: ['To ice-break the first contact with introduction of trainer and trainees\nلكسر الحاجز في اللقاء الأول مع تقديم المدرب والمتدربين'], time: '15 min' },
    'key messages': { expectations: ['To Have key messages of each module in booklet in which trainee can add notes\nالحصول على الرسائل الرئيسية لكل وحدة في كتيب يمكن للمتدرب تدوين الملاحظات فيه'], time: '5min' },
    'company Context': { expectations: ['To Know about Yazaki worldwide, history, policy, values and actual company\nالتعرف على شركة Yazaki على المستوى العالمي، تاريخها، سياساتها، قيمها والشركة الحالية'], time: '45 min' },
    'health and safety': { expectations: ['To Learn about Health and Safety overview and general consigns\nالتعرف على نظرة عامة حول الصحة والسلامة والتعليمات العامة', 'To Learn about Health and Safety IPE in showcase\nالتعرف على معدات الحماية الفردية في عرض خاص'], time: '2h50min' },
    'WH Production Flow': { expectations: ['To Learn overall WH manufacturing Flow from Supplier to customer including WH mounting car\nالتعرف على تدفق تصنيع الضفائر من المورد إلى الزبون بما في ذلك تركيبها في السيارة', 'To See where and how exactly the WH is mounted on the car\nمعرفة أين وكيف يتم تركيب الضفيرة في السيارة', 'To observe overall manufacturing flow in real areas\nملاحظة تدفق التصنيع الفعلي في المناطق الحقيقية'], time: '1h35min' },
    'Good car comes from good WH': { expectations: ['To Feel the importance of quality in front of the final car driver\nالإحساس بأهمية الجودة أمام سائق السيارة النهائي'], time: '5 min' },
    '5 s': { expectations: ['To Learn about 5S: what to do and what not do in workstation\nالتعرف على 5S: ما يجب وما لا يجب فعله في مكان العمل'], time: '30 min' },
    '7 Muda': { expectations: ['To Learn about 7 Muda: what to do and what not do in workstation\nالتعرف على 7 أنواع من الهدر: ما يجب وما لا يجب فعله في مكان العمل'], time: '1h10min' },
    'Gemba Rules': { expectations: ['To Learn about Gemba rules: what to do and what not do in shopfloor\nالتعرف على قواعد جيمبا: ما يجب وما لا يجب فعله في ورشة العمل', 'To Learn about different Yazaki uniforms, colors and purposes\nالتعرف على الزي الرسمي الخاص بـيازاكي، ألوانه واستخداماته المختلفة'], time: '50min' },
    'production process and material': { expectations: ['To Learn about production flow process and material used for each step\nالتعرف على مراحل عملية الإنتاج والمواد المستخدمة في كل خطوة', 'To simulate and feel with touch the components used in production\nمحاكاة ولمس المكونات المستخدمة في الإنتاج'], time: '1h40min' },
    'YAZAKI Image': { expectations: ['To Feel the importance of operator building Quality in front of Customer as YAZAKI image\nالإحساس بأهمية دور العامل في بناء الجودة أمام الزبون كصورة لشركة يازاكي'], time: '5 min' },
    'Andon': { expectations: ['To Learn how to manage abnormalities in workstation using Andon tower\nالتعرف على كيفية التعامل مع الحالات غير الطبيعية في مكان العمل باستخدام برج اندون'], time: '15 min' },
    'Quality': { expectations: ['To Learn about quality targets and different defects\nالتعرف على أهداف الجودة وأنواع العيوب المختلفة', 'To simulate and feel with touch top 4 defects in the plant\nمحاكاة ولمس أكثر 4 عيوب شيوعًا في المصنع'], time: '30 min' },
    'Environment': { expectations: ['To Learn about Environment overview\nالتعرف على لمحة عامة عن البيئة'], time: '1h50min' },
    'Special processes': { expectations: ['To Learn about special process in criticality on WH and car driver\nالتعرف على العمليات الخاصة وتأثيرها الحرج على الضفيرة وسائق السيارة'], time: '45 min' },
    'Added value of operator': { expectations: ['To Feel the importance of trainee in society as producer of all cars WH\nالإحساس بأهمية المتدرب في المجتمع كمنتج'], time: '45 min' }
  };

  modelImages: { [key: string]: string } = {
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const modelName = params.get('modelName');
      if (modelName) {
        this.expandedModel = modelName;
        this.loadModelDetails(modelName);
      }
    });
    
    // Charger les données avec le système de cache
    this.loadDataWithCache();
  }

  // Nouvelle méthode pour charger les données avec cache
  private loadDataWithCache(): void {
    const now = Date.now();
    const cacheValid = SupportListComponent.lastFetchTime && 
                      (now - SupportListComponent.lastFetchTime) < SupportListComponent.CACHE_DURATION;

    if (SupportListComponent.cachedMetadata && 
        SupportListComponent.cachedGroupedMetadata && 
        cacheValid) {
      // Utiliser les données en cache
      console.log('Utilisation des données en cache');
      this.allMetadata = SupportListComponent.cachedMetadata;
      this.groupedMetadata = SupportListComponent.cachedGroupedMetadata;
      this.displayedDays = this.objectKeys(this.groupedMetadata).filter(day => ['0', '1', '2'].includes(day));
      this.isLoading = false;
      this.showSkeleton = false;
    } else {
      // Charger les données depuis l'API
      console.log('Chargement des données depuis l\'API');
      this.fetchAllMetadata();
    }
  }

  // Méthode pour forcer le rafraîchissement des données
  public refreshData(): void {
    SupportListComponent.cachedMetadata = null;
    SupportListComponent.cachedGroupedMetadata = null;
    SupportListComponent.lastFetchTime = 0;
    this.loadDataWithCache();
  }

  // Méthode pour vérifier si le cache est valide
  private isCacheValid(): boolean {
    const now = Date.now();
    return SupportListComponent.lastFetchTime > 0 && 
           (now - SupportListComponent.lastFetchTime) < SupportListComponent.CACHE_DURATION;
  }

  getSkeletonItems(count: number): number[] {
    return Array(count).fill(0).map((x, i) => i);
  }

  getAllModelNames(): string[] {
    return Object.keys(this.modelInfos);
  }

  searchModelsByName(searchTerm: string): string[] {
    if (!searchTerm.trim()) {
      return this.getAllModelNames();
    }
    
    const searchLower = searchTerm.toLowerCase();
    return this.getAllModelNames().filter(modelName => 
      modelName.toLowerCase().includes(searchLower)
    );
  }

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

  performSearch(): void {
    const term = this.searchTerm.trim();
    
    if (!term) {
      this.allSearchResults = [];
      return;
    }

    let foundModels: string[] = [];
    
    if (this.searchType === 'name') {
      foundModels = this.searchModelsByName(term);
    } else {
      foundModels = this.searchModelsByExpectation(term);
    }

    this.allSearchResults = foundModels.map(modelName => ({
      modelName,
      image: this.modelImages[modelName] || 'assets/images/default.jpg',
      expectations: this.modelInfos[modelName]?.expectations || [],
      time: this.modelInfos[modelName]?.time || '',
      englishName: this.getEnglishText(modelName),
      arabicName: this.getArabicText(modelName)
    }));
  }

  onSearchTypeChange(): void {
    if (this.searchTerm.trim()) {
      this.performSearch();
    }
  }

  hasSearchResultsForModels(): boolean {
    return this.allSearchResults.length > 0;
  }

  getFormattedSearchResults(): any[] {
    return this.allSearchResults;
  }

  onSearchChange(): void {
    this.searchTerm = this.searchTerm.trim();
    this.isSearchActive = this.searchTerm.length > 0;
    
    if (this.isSearchActive) {
      this.filterModules();
    } else {
      this.filteredMetadata = {};
    }
    
    this.expandedModel = '';
    this.expandedExpectation = null;
  }

  private filterModules(): void {
    this.filteredMetadata = {};
    const searchLower = this.searchTerm.toLowerCase();

    Object.keys(this.groupedMetadata).forEach(day => {
      Object.keys(this.groupedMetadata[day]).forEach(modelName => {
        if (modelName.toLowerCase().includes(searchLower)) {
          if (!this.filteredMetadata[day]) {
            this.filteredMetadata[day] = {};
          }
          this.filteredMetadata[day][modelName] = this.groupedMetadata[day][modelName];
        }
      });
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.isSearchActive = false;
    this.filteredMetadata = {};
    this.expandedModel = '';
    this.expandedExpectation = null;
  }

  hasSearchResults(): boolean {
    if (!this.isSearchActive) return true;
    
    return Object.keys(this.filteredMetadata).some(day => 
      Object.keys(this.filteredMetadata[day] || {}).length > 0
    );
  }

  getSearchResultsCount(): number {
    if (!this.isSearchActive) return 0;
    
    let count = 0;
    Object.keys(this.filteredMetadata).forEach(day => {
      count += Object.keys(this.filteredMetadata[day] || {}).length;
    });
    
    return count;
  }

  getDisplayedMetadata(): any {
    return this.isSearchActive ? this.filteredMetadata : this.groupedMetadata;
  }

  getDisplayedDays(): string[] {
    const metadata = this.getDisplayedMetadata();
    return Object.keys(metadata).filter(day => 
      Object.keys(metadata[day] || {}).length > 0
    ).sort((a, b) => parseInt(a) - parseInt(b));
  }

  isModuleHighlighted(modelName: string): boolean {
    if (!this.isSearchActive || !this.searchTerm) return false;
    return modelName.toLowerCase().includes(this.searchTerm.toLowerCase());
  }

  highlightSearchTerm(text: string): string {
    if (!this.isSearchActive || !this.searchTerm || !text) {
      return text;
    }
    
    const searchTerm = this.searchTerm.trim();
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  fetchAllMetadata(): void {
    if (!this.authService.checkAuthentication()) {
      this.errorMessage = 'Vous devez être connecté pour voir les supports';
      this.router.navigate(['/login']);
      return;
    }

    // Afficher le loading seulement si pas de cache
    this.isLoading = true;
    this.showSkeleton = true;
    this.errorMessage = '';

    this.http.get<any>(`${this.apiUrl}/api/supports/drive/all/metadata-format`, {
      headers: { Authorization: `Bearer ${this.authService.getAuthToken()}` }
    }).subscribe({
      next: (response) => {
        console.log('Response received:', response);
        
        if (response && response.success && response.metadata) {
          this.allMetadata = response.metadata.map((support: any) => ({
            id: support.id,
            filename: support.filename,
            description: support.description,
            tags: support.tags || [],
            expectation: support.expectation,
            model_name: support.model_name,
            model_day: support.model_day,
            upload_date: support.upload_date,
            drive_id: support.drive_id,
            file_type: support.file_type,
            file_extension: support.file_extension,
            folder_type: support.folder_type,
            view_url: support.view_url,
            download_url: support.download_url,
            web_view_link: support.web_view_link,
            questions: support.questions || [],
            questions_count: support.questions_count || 0,
            has_metadata: true,
            drive_file_exists: support.drive_file_exists || true
          }));
          
          console.log(`Traité ${this.allMetadata.length} fichiers avec métadonnées`);
          
          if (this.allMetadata.length === 0) {
            this.errorMessage = 'Aucun fichier avec métadonnées trouvé dans Google Drive';
          } else {
            this.errorMessage = '';
            this.groupMetadataByDayAndModel();
            this.displayedDays = this.objectKeys(this.groupedMetadata).filter(day => ['0', '1', '2'].includes(day));
            
            // Mettre en cache les données
            SupportListComponent.cachedMetadata = [...this.allMetadata];
            SupportListComponent.cachedGroupedMetadata = { ...this.groupedMetadata };
            SupportListComponent.lastFetchTime = Date.now();
          }
        } else {
          this.errorMessage = 'Données mal formatées reçues du serveur';
          console.error('Invalid response format. Expected response.metadata, got:', response);
        }
        
        this.isLoading = false;
        this.showSkeleton = false;
      },
      error: (error) => {
        console.error('Erreur de récupération des métadonnées:', error);
        this.errorMessage = 'Erreur lors de la récupération des métadonnées';
        this.isLoading = false;
        this.showSkeleton = false;
        
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  fetchAllMetadataFromDB(): void {
    if (!this.authService.checkAuthentication()) {
      this.errorMessage = 'Vous devez être connecté pour voir les supports';
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.showSkeleton = true;

    this.http.get<any>(`${this.apiUrl}/api/supports/metadata/all`, {
      headers: { Authorization: `Bearer ${this.authService.getAuthToken()}` }
    }).subscribe({
      next: (response) => {
        console.log('Metadata DB response:', response);
        
        if (response && response.success && response.data && response.data.supports) {
          this.allMetadata = response.data.supports.map((support: any) => ({
            id: support.id,
            filename: support.filename,
            description: support.description,
            tags: support.tags || [],
            expectation: support.expectation,
            model_name: support.model_name,
            model_day: support.model_day,
            upload_date: support.upload_date,
            file_type: support.file_type,
            file_extension: support.file_extension,
            questions_count: support.questions_count || 0,
            questions: support.questions || [],
            drive_file_exists: support.drive_file_exists || false,
            view_url: support.view_url,
            download_url: support.download_url,
            has_metadata: true
          }));
          
          console.log(`Récupéré ${this.allMetadata.length} supports depuis la base de données`);
          
          if (this.allMetadata.length === 0) {
            this.errorMessage = 'Aucune métadonnée trouvée en base de données';
          } else {
            this.errorMessage = '';
            this.groupMetadataByDayAndModel();
            this.displayedDays = this.objectKeys(this.groupedMetadata).filter(day => ['0', '1', '2'].includes(day));
            
            // Mettre en cache les données
            SupportListComponent.cachedMetadata = [...this.allMetadata];
            SupportListComponent.cachedGroupedMetadata = { ...this.groupedMetadata };
            SupportListComponent.lastFetchTime = Date.now();
          }
        } else {
          this.errorMessage = 'Format de réponse invalide depuis la base de données';
          console.error('Invalid DB response format:', response);
        }
        
        this.isLoading = false;
        this.showSkeleton = false;
      },
      error: (error) => {
        console.error('Erreur de récupération des métadonnées DB:', error);
        this.errorMessage = 'Erreur lors de la récupération des métadonnées depuis la base';
        this.isLoading = false;
        this.showSkeleton = false;
        
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadModelDetails(modelName: string): void {
    if (!this.authService.checkAuthentication()) {
      this.errorMessage = 'Vous devez être connecté pour voir les supports';
      this.router.navigate(['/login']);
      return;
    }

    // Vérifier si les détails sont déjà en cache
    if (this.modelDetailsCache[modelName]) {
      console.log('Détails du modèle déjà en cache:', modelName);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(`${this.apiUrl}/api/supports/show?model_name=${encodeURIComponent(modelName)}`, {
      headers: { Authorization: `Bearer ${this.authService.getAuthToken()}` }
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response && response.files) {
          console.log('Détails du modèle reçus:', response.files);
          
          this.modelDetailsCache[modelName] = response.files.map((file: { filename: string | number | boolean; }) => ({
            ...file,
            url: `${this.apiUrl}/api/supports/view?model_name=${encodeURIComponent(modelName)}&filename=${encodeURIComponent(file.filename)}`
          }));

          this.updateGroupedMetadataForModel(modelName, this.modelDetailsCache[modelName]);
        } else {
          this.errorMessage = 'Données mal formatées reçues du serveur';
          console.error('Invalid response format:', response);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Erreur de récupération des détails du modèle:', error);
        this.errorMessage = `Erreur lors de la récupération des détails du modèle: ${error.message}`;
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  updateGroupedMetadataForModel(modelName: string, modelDetails: any[]): void {
    Object.keys(this.groupedMetadata).forEach(day => {
      if (this.groupedMetadata[day][modelName]) {
        const detailsForDay = modelDetails.filter(detail => 
          detail.model_day?.toString() === day
        );
        
        if (detailsForDay.length > 0) {
          this.groupedMetadata[day][modelName] = detailsForDay;
          
          // Mettre à jour aussi le cache statique
          if (SupportListComponent.cachedGroupedMetadata) {
            if (!SupportListComponent.cachedGroupedMetadata[day]) {
              SupportListComponent.cachedGroupedMetadata[day] = {};
            }
            SupportListComponent.cachedGroupedMetadata[day][modelName] = detailsForDay;
          }
        }
      }
    });
  }

  groupMetadataByDayAndModel(): void {
    this.groupedMetadata = this.allMetadata.reduce((acc, support) => {
      const day = support.model_day?.toString() || '0';
      const modelName = support.model_name || 'unknown';
      if (!acc[day]) {
        acc[day] = {};
      }
      if (!acc[day][modelName]) {
        acc[day][modelName] = [];
      }
      acc[day][modelName].push({
        ...support,
        filename: support.filename,
        url: `${this.apiUrl}/api/supports/view?model_name=${encodeURIComponent(modelName)}&filename=${encodeURIComponent(support.filename)}`
      });
      return acc;
    }, {} as Record<string, Record<string, any[]>>);
    console.log('Métadonnées groupées par jour et modèle');
  }

  getModelDetails(modelName: string): any[] {
    return this.modelDetailsCache[modelName] || [];
  }

  isModelDetailsLoaded(modelName: string): boolean {
    return !!this.modelDetailsCache[modelName];
  }

  toggleExpectation(expectation: string, event: Event): void {
    event.stopPropagation();
    this.expandedExpectation = this.expandedExpectation === expectation ? null : expectation;
  }

  getVideosForExpectation(day: string, modelName: string, expectation: string): any[] {
    const modelDetails = this.getModelDetails(modelName);
    const supports = modelDetails.length > 0 ? 
      modelDetails.filter(detail => detail.model_day?.toString() === day) :
      this.groupedMetadata[day]?.[modelName] || [];
    
    if (expectation === 'all-videos') {
      return supports;
    }
    
    return supports.filter(support => {
      if (!support.expectation) return false;
      
      const supportExpectation = support.expectation.toLowerCase();
      const searchExpectation = expectation.toLowerCase();
      
      return supportExpectation.includes(searchExpectation) || 
             this.matchExpectationKeywords(supportExpectation, searchExpectation);
    });
  }

  private matchExpectationKeywords(supportExpectation: string, searchExpectation: string): boolean {
    const keywords = this.extractKeywords(searchExpectation);
    return keywords.some(keyword => supportExpectation.includes(keyword));
  }

  private extractKeywords(text: string): string[] {
    const stopWords = ['to', 'about', 'the', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by'];
    
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return words;
  }

  getAllVideosForModel(day: string, modelName: string): any[] {
    const modelDetails = this.getModelDetails(modelName);
    if (modelDetails.length > 0) {
      return modelDetails.filter(detail => detail.model_day?.toString() === day);
    }
    return this.groupedMetadata[day]?.[modelName] || [];
  }

  sanitizeUrl(url: string): SafeUrl {
    console.log('Sanitizing URL:', url);
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  onVideoError(event: Event): void {
    console.error('Video error:', event);
    this.errorMessage = 'Erreur lors du chargement de la vidéo';
  }

  getDayExpectations(day: string): string[] {
    return this.dayExpectations[day] || [];
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getExpectationId(expectation: string): string {
    return expectation.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  truncateExpectation(expectation: string, maxLength: number = 100): string {
    if (expectation.length <= maxLength) return expectation;
    return expectation.substring(0, maxLength) + '...';
  }

  getVideoCountForExpectation(day: string, modelName: string, expectation: string): number {
    return this.getVideosForExpectation(day, modelName, expectation).length;
  }

  formatVideoDuration(duration: number): string {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  hasVideos(day: string, modelName: string): boolean {
    return this.getAllVideosForModel(day, modelName).length > 0;
  }

  toggleModel(modelName: string): void {
    this.router.navigate(['/model-detail', modelName]);
  }

  splitBilingualText(text: string): [string, string] {
    if (!text) return ['', ''];
    const parts = text.split('\n').map(s => s.trim());
    return [parts[0] || '', parts[1] || ''];
  }

  getEnglishText(text: string): string {
    return this.splitBilingualText(text)[0];
  }

  getArabicText(text: string): string {
    return this.splitBilingualText(text)[1];
  }

  // Méthode pour vider le cache si nécessaire (utile pour les tests ou le développement)
  public clearCache(): void {
    SupportListComponent.cachedMetadata = null;
    SupportListComponent.cachedGroupedMetadata = null;
    SupportListComponent.lastFetchTime = 0;
    console.log('Cache vidé');
  }

  // Méthode pour obtenir le statut du cache (utile pour le debugging)
  public getCacheStatus(): { hasCache: boolean, isValid: boolean, age: number } {
    return {
      hasCache: !!SupportListComponent.cachedMetadata,
      isValid: this.isCacheValid(),
      age: SupportListComponent.lastFetchTime ? Date.now() - SupportListComponent.lastFetchTime : 0
    };
  }
}