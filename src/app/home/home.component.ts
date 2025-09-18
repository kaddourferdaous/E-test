import { Component, HostListener, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { debounceTime, distinctUntilChanged, Observable, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SearchResult, SearchService } from '../model-search.service';

interface Expectation {
  en: string;
  ar: string;
}

interface CandidateInfo {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  avatar?: string;
  matricule?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  niveau?: string;
  filiere?: string;
  etablissement?: string;
  percentage?: number;
  test1_percentage?: number;
  test2_percentage?: number;
  final_test_percentage?: number;
  final_test_seuil?: number;
  final_test_score?: number;
  final_test_total?: number;
  final_test_duration?: number;
  score?: number;
  total?: number;
  created_at?: string;
  status?: 'active' | 'inactive' | 'pending';
  lastActivity?: string;
  ville_origine?: string;
  contract_signed_date?: string;
  detailed_debug?: {
    final_test?: {
      has_result?: boolean;
      date?: string;
      score_details?: string;
    };
  };
}

interface Course {
  id: string;
  titleEn: string;
  titleAr: string;
  duration?: string;
  image?: string;
  expectations?: Expectation[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  candidateId: string = '';
  candidateName: string = '';
  candidateEmail: string = '';
  isAuthenticated: boolean = false;
  searchQuery: string = '';
  isDark = false;
  dropdownOpen = false; 
  searchTerm: string = '';
  searchResults: SearchResult[] = [];
  isSearching: boolean = false;
  showResults: boolean = false;
  isSearchingActive: boolean = false;
  candidateInfo: CandidateInfo | null = null;
  searchType: 'name' | 'expectation' = 'name';
  isLoading: boolean = false;
  isMenuOpen = false;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private apiUrl = 'https://training-backend-1pda.onrender.com/dash';
  private baseUrl = `${this.apiUrl}/auth`;

  constructor(
    private authService: AuthService,
    private searchService: SearchService,
    private router: Router,
    private translate: TranslateService,
    private render: Renderer2,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Check authentication first and redirect if not authenticated
    if (!this.authService.checkAuthentication()) {
      console.log('L\'utilisateur n\'est pas authentifié - redirection vers login');
      this.router.navigate(['/login']);
      return; // Stop execution if not authenticated
    }
    
    // Only proceed if authenticated
    this.isAuthenticated = true;
    console.log('L\'utilisateur est authentifié');
    this.loadCandidateInfo();
    
    // Configuration de la recherche avec debounce
    this.searchSubject.pipe(
      debounceTime(400), // Attendre 300ms après la dernière frappe
      distinctUntilChanged(), // Éviter les recherches en double
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });

    // S'abonner aux résultats de recherche
    this.searchService.searchResults$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.searchResults = results;
      this.showResults = results.length > 0;
      this.isSearching = false;
      this.updateSearchResultsDisplay();
    });
  }

  ngAfterViewInit(): void {
    this.initializeSearchUI();
    this.initializeScrollProgress();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    const body = document.body;

    if (this.isDark) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }

  private initializeSearchUI(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
    const closeSearch = document.getElementById('closeSearch') as HTMLButtonElement;
    const searchOverlay = document.getElementById('searchResultsOverlay') as HTMLElement;
    const searchTypeButtons = document.querySelectorAll('.search-type-btn');

    // Event listeners pour la recherche
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearchSubmit();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearchSubmit());
    }

    if (closeSearch) {
      closeSearch.addEventListener('click', () => this.closeSearchResults());
    }

    if (searchOverlay) {
      searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
          this.closeSearchResults();
        }
      });
    }

    // Event listeners pour les boutons de type de recherche
    searchTypeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const type = target.getAttribute('data-type') as 'name' | 'expectation';
        this.handleSearchTypeChange(type);
      });
    });
  }

  private initializeScrollProgress(): void {
    const scrollProgress = document.getElementById('scrollProgress') as HTMLElement;
    const header = document.getElementById('header') as HTMLElement;

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / documentHeight) * 100;
      
      if (scrollProgress) {
        scrollProgress.style.width = scrollPercent + '%';
      }

      // Header scroll effect
      if (header) {
        if (scrollTop > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    });
  }

  private handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    
    if (this.searchTerm.trim()) {
      this.isSearching = true;
      this.searchSubject.next(this.searchTerm);
    } else {
      this.clearSearch();
    }
  }

  private handleSearchSubmit(): void {
    if (this.searchTerm.trim()) {
      this.performSearch(this.searchTerm);
      this.showSearchResults();
    }
  }

  private handleSearchTypeChange(type: 'name' | 'expectation'): void {
    this.searchType = type;
    
    // Update active button
    document.querySelectorAll('.search-type-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`)?.classList.add('active');

    if (this.searchTerm.trim()) {
      this.performSearch(this.searchTerm);
    }
  }

  performSearch(term: string): void {
    if (!term.trim()) {
      this.clearSearch();
      return;
    }

    this.isSearching = true;
    this.searchService.performSearch(term, this.searchType);
    this.searchService.updateSearchTerm(term);
  }

  private showSearchResults(): void {
    const overlay = document.getElementById('searchResultsOverlay') as HTMLElement;
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }

  private closeSearchResults(): void {
    const overlay = document.getElementById('searchResultsOverlay') as HTMLElement;
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.showResults = false;
    this.isSearching = false;
    this.isSearchingActive = false; // retour à l'accueil
    this.searchService.clearSearchResults();
    this.closeSearchResults();
    
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
  }

  private updateSearchResultsDisplay(): void {
    const resultsGrid = document.getElementById('searchResultsGrid') as HTMLElement;
    const resultsTitle = document.getElementById('searchResultsTitle') as HTMLElement;
    const resultsSubtitle = document.getElementById('searchResultsSubtitle') as HTMLElement;

    if (!resultsGrid) return;

    if (this.isSearching) {
      resultsGrid.innerHTML = `
        <div class="search-loading">
          <div class="spinner"></div>
        </div>
      `;
      return;
    }

    if (this.searchResults.length === 0) {
      resultsGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <h4>No results found</h4>
          <p>Try adjusting your search terms or search type</p>
        </div>
      `;
      if (resultsTitle) resultsTitle.textContent = 'No Results';
      if (resultsSubtitle) resultsSubtitle.textContent = 'No courses found matching your search';
      return;
    }

    // Update title and subtitle
    if (resultsTitle) resultsTitle.textContent = 'Search Results';
    if (resultsSubtitle) resultsSubtitle.textContent = `Found ${this.searchResults.length} course${this.searchResults.length > 1 ? 's' : ''} matching your search`;

    // Generate results HTML
    resultsGrid.innerHTML = this.searchResults.map(result => `
      <div class="search-result-card" onclick="navigateToModel('${result.modelName}')">
        <img src="${result.image}" alt="${result.modelName}" class="search-result-image" 
             onerror="this.src='https://via.placeholder.com/300x200?text=Course'">
        <div class="search-result-content">
          <h5 class="search-result-title">${this.highlightSearchTerm(result.modelName)}</h5>
          <span class="search-result-time">${result.time}</span>
          <div class="search-result-expectations">
            ${result.expectations.map(exp => {
              const [english, arabic] = this.splitBilingualText(exp);
              return `
                <div class="search-result-languages">
                  <div class="language-text english-text">${this.highlightSearchTerm(english)}</div>
                  ${arabic ? `<div class="language-text arabic-text">${this.highlightSearchTerm(arabic)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          ${result.hasVideos ? `
            <div class="video-indicator">
              <i class="fas fa-play-circle"></i>
              <span>${result.videoCount || 0} video${(result.videoCount || 0) > 1 ? 's' : ''}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Show results if we have them
    if (this.searchResults.length > 0) {
      this.showSearchResults();
    }
  }

  // Navigation vers le détail du modèle
  navigateToModel(modelName: string): void {
    this.closeSearchResults();
    this.router.navigate(['/support-list', modelName]);
  }

  // Navigation vers la liste des supports
  navigateToSupportList(): void {
    this.router.navigate(['/support-list']);
  }

  // Méthodes utilitaires
  highlightSearchTerm(text: string): string {
    if (!this.searchTerm || !text) {
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

  truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Méthodes pour le texte bilingue
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

  // Rest of your component methods...
  rechercher() {
    if (!this.searchQuery) return;
    // Rest of the method...
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.dropdownOpen = false;
    }
  }

  checkAuthentication(): void {
    this.isAuthenticated = this.authService.checkAuthentication();
    if (!this.isAuthenticated) {
      console.log('L\'utilisateur n\'est pas authentifié');
      this.router.navigate(['/login']);
    } else {
      console.log('L\'utilisateur est authentifié');
    }
  }

  loadCandidateInfo(): void {
    const candidateInfo = localStorage.getItem('candidateInfo');
    
    if (candidateInfo) {
      try {
        const candidate = JSON.parse(candidateInfo);
        // Utilisez la méthode de formatage du profil component
        this.candidateInfo = this.formatCandidateInfo(candidate);
        this.candidateId = this.candidateInfo.id || 'Inconnu';
        this.candidateName = this.candidateInfo.name || 'Inconnu';
        this.candidateEmail = this.candidateInfo.email || 'Inconnu';
        
        console.log('Informations du candidat chargées depuis localStorage:', this.candidateInfo);
        
        // Essayer de récupérer des informations plus complètes depuis l'API
        if (this.candidateId !== 'Inconnu') {
          this.fetchCandidateFromAPI(this.candidateId);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations du candidat depuis localStorage:', error);
      }
    } else {
      console.log('Aucune information de candidat trouvée dans localStorage.');
    }
  }

  private formatCandidateInfo(storedInfo: any): CandidateInfo {
    return {
      id: storedInfo.id || storedInfo.candidateId || storedInfo._id || 'N/A',
      name: this.formatFullName(storedInfo),
      email: storedInfo.email || storedInfo.mail || 'Email non disponible',
      joinDate: storedInfo.joinDate || storedInfo.created_at || storedInfo.dateInscription || new Date().toISOString().split('T')[0],
      matricule: storedInfo.matricule || storedInfo.numeroEtudiant || 'N/A',
      nom: storedInfo.nom || storedInfo.lastName || '',
      prenom: storedInfo.prenom || storedInfo.firstName || '',
      telephone: storedInfo.tele || storedInfo.telephone || storedInfo.phone || storedInfo.tel || 'Non renseigné',
      adresse: storedInfo.Adresse_sur_Tanger || storedInfo.adresse || storedInfo.address || 'Non renseignée',
      dateNaissance: storedInfo.date_naissance || storedInfo.dateNaissance || storedInfo.birthDate || storedInfo.dateOfBirth || 'Non renseignée',
      niveau: storedInfo.Niveau_etude || storedInfo.niveau || storedInfo.level || storedInfo.grade || 'Non renseigné',
      filiere: storedInfo.filiere || storedInfo.speciality || storedInfo.field || 'Non renseignée',
      etablissement: storedInfo.etablissement || storedInfo.school || storedInfo.institution || 'Non renseigné',
      avatar: storedInfo.avatar || storedInfo.photo || storedInfo.profileImage || '',
      percentage: storedInfo.percentage || storedInfo.totalScore || 0,
      test1_percentage: storedInfo.test1_percentage || storedInfo.test1Score || 0,
      test2_percentage: storedInfo.test2_percentage || storedInfo.test2Score || 0,
      final_test_percentage: storedInfo.final_test_percentage || storedInfo.finalTestScore || 0,
      final_test_seuil: storedInfo.final_test_seuil || 75,
      final_test_score: storedInfo.final_test_score || 0,
      final_test_total: storedInfo.final_test_total || 0,
      final_test_duration: storedInfo.final_test_duration || 0,
      score: storedInfo.score || storedInfo.currentScore || 0,
      total: storedInfo.total || storedInfo.maxScore || 0,
      created_at: storedInfo.created_at || storedInfo.createdAt || storedInfo.dateCreation || '',
      status: storedInfo.status || storedInfo.state || 'active',
      lastActivity: storedInfo.last_contact_date || storedInfo.lastActivity || storedInfo.lastLogin || storedInfo.derniereConnexion || 'Inconnue',
      ville_origine: storedInfo.Ville_origine || storedInfo.ville_origine || 'Non renseignée',
      contract_signed_date: storedInfo.contract_signed_date || 'Non renseignée',
      detailed_debug: storedInfo.detailed_debug || { final_test: { has_result: false } }
    };
  }

  private formatFullName(candidateInfo: any): string {
    if (candidateInfo.nom && candidateInfo.prenom) {
      return `${candidateInfo.prenom} ${candidateInfo.nom}`;
    } else if (candidateInfo.firstName && candidateInfo.lastName) {
      return `${candidateInfo.firstName} ${candidateInfo.lastName}`;
    } else if (candidateInfo.nom) {
      return candidateInfo.nom;
    } else if (candidateInfo.name) {
      return candidateInfo.name;
    } else if (candidateInfo.fullName) {
      return candidateInfo.fullName;
    } else {
      return 'Nom non disponible';
    }
  }

  private async fetchCandidateFromAPI(candidateId: string): Promise<void> {
    if (!candidateId || candidateId === 'Inconnu') return;

    const headers = this.getHttpHeaders();
    
    try {
      const url = `${this.baseUrl}/candidate/${candidateId}`;
      console.log('Récupération des données candidat depuis:', url);
      
      const response = await this.http.get<any>(url, { headers }).toPromise();
      
      if (response && response.success && response.candidate) {
        const apiCandidateInfo = this.formatCandidateInfo(response.candidate);
        // Fusionner avec les données existantes
        this.candidateInfo = { ...this.candidateInfo, ...apiCandidateInfo };
        
        // Mettre à jour les propriétés utilisées dans le template
        this.candidateName = this.candidateInfo.name;
        this.candidateEmail = this.candidateInfo.email;
        
        console.log('Données candidat mises à jour depuis l\'API:', this.candidateInfo);
      }
    } catch (error) {
      console.warn('Impossible de récupérer les données depuis l\'API:', error);
      // Ne pas bloquer l'application si l'API n'est pas disponible
    }
  }

  private getHttpHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = this.authService.getAuthToken() || localStorage.getItem('candidateToken');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  logout(): void {
    this.authService.logout();
    this.candidateId = '';
    this.candidateName = '';
    this.candidateEmail = '';
    this.isAuthenticated = false;
    console.log('Déconnexion réussie');
    this.router.navigate(['/login']);
  }

  //avatar section
  getStatusBadgeClass(): string {
    const status = this.getCandidateStatus();
    switch (status) {
      case 'accepted': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'in_progress': return 'badge-warning';
      case 'pending': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getStatusText(): string {
    const status = this.getCandidateStatus();
    switch (status) {
      case 'accepted': return 'Admis';
      case 'rejected': return 'Non admis';
      case 'in_progress': return 'En cours';
      case 'pending': return 'Non passé';
      default: return 'Non passé';
    }
  }

  getInitials(): string {
    if (!this.candidateInfo?.name) {
      // Fallback vers candidateName si candidateInfo n'est pas disponible
      const name = this.candidateName || 'U';
      if (name === 'Inconnu') return 'U';
      
      const names = name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    
    const names = this.candidateInfo.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return this.candidateInfo.name.charAt(0).toUpperCase();
  }

  getCandidateStatus(): 'accepted' | 'rejected' | 'pending' | 'in_progress' {
    if (!this.candidateInfo || !this.candidateInfo.detailed_debug?.final_test) {
      return 'pending';
    }
    if (!this.candidateInfo.detailed_debug.final_test.has_result) {
      return this.candidateInfo.final_test_duration ? 'in_progress' : 'pending';
    }
    return this.isCandidateAccepted() ? 'accepted' : 'rejected';
  }

  isCandidateAccepted(): boolean {
    if (!this.candidateInfo || 
        this.candidateInfo.final_test_percentage === undefined || 
        this.candidateInfo.final_test_seuil === undefined ||
        !this.candidateInfo.detailed_debug?.final_test?.has_result) {
      return false;
    }
    return this.candidateInfo.final_test_percentage >= this.candidateInfo.final_test_seuil;
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    console.log('Menu toggled:', this.isMenuOpen); // Pour déboguer
  }

  // Fonction pour fermer le menu
  closeMenu() {
    this.isMenuOpen = false;
  }

  // Vérifier si une route est active
  isActive(route: string): boolean {
    return this.router.url === route;
  }
}