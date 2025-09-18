import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { Observable, of, finalize, catchError, map } from 'rxjs';

// Interfaces
interface ProgressData {
  totalModules: number;
  completedModules: number;
  dailyTestScores: Array<{ date: string; score: number; module: string; total: number; percentage: number; duration?: number; formatted_duration?: string }>;
  totalTimeSpent: number;
  achievements: Array<{ id: string; name: string; description: string; earned: boolean; date?: string }>;
  weeklyProgress: Array<{ week: string; completion: number; time: number }>;
  currentStreak: number;
  bestStreak: number;
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

interface TestScore {
  date: string;
  score: number;
  total: number;
  percentage: number;
  module: string;
  type: 'test1' | 'test2' | 'final_test';
}

interface ThresholdResponse {
  success: boolean;
  threshold?: number;
  default_threshold?: number;
  recent_threshold?: number;
  message?: string;
}

@Component({
  selector: 'app-candidate-profile',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit, AfterViewInit {
  // Variables d'état
  candidateInfo: CandidateInfo | null = null;
  progressData: ProgressData | null = null;
  testScores: TestScore[] = [];
  
  // États de chargement
  loading = true;
  isLoading = false;
  thresholdLoading = false;
  
  // Gestion d'erreurs
  error: string | null = null;
  thresholdError: string | null = null;
  
  // Configuration
  selectedTab: 'overview' | 'progress' | 'achievements' | 'analytics' | 'profile' = 'overview';
  acceptanceThreshold: number = 75;
  
  // URL API
  private apiUrl = 'https://training-backend-1pda.onrender.com/dash';
  private baseUrl = `${this.apiUrl}/auth`;

  // ID du candidat depuis la route
  private routeCandidateId: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('ProfilComponent - constructeur appelé');
  }

  ngOnInit(): void {
    console.log('ProfilComponent - initialisation');

    // Récupérer l'ID du candidat depuis les paramètres de la route
    this.route.paramMap.subscribe(params => {
      this.routeCandidateId = params.get('id');
      console.log('ProfilComponent - ID du candidat depuis la route:', this.routeCandidateId);

      // Vérifier l'authentification si aucun ID de route n'est fourni (cas du candidat connecté)
      if (!this.routeCandidateId && !this.isCandidateAuthenticated()) {
        console.warn('ProfilComponent - candidat non authentifié, redirection vers login');
        this.router.navigate(['/candidateLogin']);
        return;
      }

      console.log('ProfilComponent - chargement des données');
      this.loadThresholdAndInitialize();
    });
  }

  ngAfterViewInit(): void {
    console.log('ProfilComponent - afterViewInit');
  }

  /**
   * Vérifier l'authentification
   */
  private isCandidateAuthenticated(): boolean {
    const token = this.authService.getAuthToken() || localStorage.getItem('candidateToken');
    const isAuth = this.authService.checkAuthentication();
    return !!(token && isAuth);
  }

  /**
   * Charger le seuil actuel depuis le backend
   */
  loadCurrentThreshold(): Observable<number> {
    console.log('ProfilComponent - chargement du seuil actuel depuis le backend');
    this.thresholdLoading = true;
    this.thresholdError = null;

    const token = this.getAuthToken();
    if (!token) {
      console.warn('ProfilComponent - token manquant pour charger le seuil');
      this.thresholdError = 'Token d\'authentification manquant';
      this.thresholdLoading = false;
      return of(75); // Valeur par défaut
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('ProfilComponent - envoi de la requête vers:', `${this.apiUrl}/api/settings/threshold/current`);

    return this.http.get<ThresholdResponse>(`${this.apiUrl}/api/settings/threshold/current`, { headers })
      .pipe(
        map((response: ThresholdResponse) => {
          console.log('ProfilComponent - réponse brute reçue:', response);
          
          if (response && response.success) {
            let thresholdValue: number | undefined;
            
            if (typeof response.threshold === 'number') {
              thresholdValue = response.threshold;
              console.log(`ProfilComponent - seuil trouvé dans response.threshold: ${thresholdValue}`);
            } else if (typeof response.default_threshold === 'number') {
              thresholdValue = response.default_threshold;
              console.log(`ProfilComponent - seuil trouvé dans response.default_threshold: ${thresholdValue}`);
            } else if (typeof response.recent_threshold === 'number') {
              thresholdValue = response.recent_threshold;
              console.log(`ProfilComponent - seuil trouvé dans response.recent_threshold: ${thresholdValue}`);
            }
            
            if (thresholdValue !== undefined) {
              console.log(`ProfilComponent - seuil récupéré avec succès: ${thresholdValue}%`);
              return thresholdValue;
            } else {
              console.warn('ProfilComponent - aucun seuil valide trouvé, utilisation de la valeur par défaut');
              return 75;
            }
          } else {
            console.error('ProfilComponent - réponse invalide ou success=false:', response);
            return 75;
          }
        }),
        catchError(err => {
          console.error('ProfilComponent - erreur lors du chargement du seuil:', err);
          this.thresholdError = 'Erreur lors du chargement du seuil: ' + (err.error?.message || err.message);
          
          if (err.status === 401) {
            console.warn('ProfilComponent - erreur 401, déconnexion');
            this.logout();
          }
          
          return of(75);
        }),
        finalize(() => {
          this.thresholdLoading = false;
        })
      );
  }

  /**
   * Charger le seuil et initialiser
   */
  loadThresholdAndInitialize(): void {
    console.log('ProfilComponent - début du chargement du seuil et initialisation');
    
    this.loadCurrentThreshold().subscribe({
      next: (threshold: number) => {
        this.acceptanceThreshold = threshold;
        console.log(`ProfilComponent - seuil récupéré avec succès: ${this.acceptanceThreshold}%`);
        this.initializeCandidateProfile();
      },
      error: (error) => {
        console.error('ProfilComponent - erreur lors du chargement du seuil:', error);
        this.acceptanceThreshold = 75;
        this.thresholdError = 'Impossible de charger le seuil, utilisation de la valeur par défaut (75%)';
        this.initializeCandidateProfile();
      }
    });
  }

  /**
   * Initialiser le profil candidat
   */
  async initializeCandidateProfile(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      // 1. Récupérer les informations du candidat depuis le localStorage (si pas d'ID de route)
      if (!this.routeCandidateId) {
        const storedCandidateInfo = this.getStoredCandidateInfo();
        if (storedCandidateInfo) {
          this.candidateInfo = this.formatCandidateInfo(storedCandidateInfo);
          this.candidateInfo.final_test_seuil = this.acceptanceThreshold;
          console.log('ProfilComponent - informations du candidat connecté:', this.candidateInfo);
        }
      }

      // 2. Récupérer les données depuis l'API avec l'ID de la route ou l'ID du candidat connecté
      await this.fetchCandidateFromAPI(this.routeCandidateId || this.getCandidateId());

      // 3. Récupérer les données de progression
      await this.fetchProgressData();

      // 4. Générer des scores de test basés sur les données disponibles
      this.generateTestScoresFromProgressData();

    } catch (err: any) {
      console.error('ProfilComponent - erreur lors de la récupération du profil:', err);
      this.error = err?.message || 'Erreur lors de la récupération du profil';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Créer des informations candidat par défaut
   */
  createDefaultCandidateInfo(): CandidateInfo {
    const candidateId = this.routeCandidateId || this.getCandidateId();
    return {
      id: candidateId || 'N/A',
      name: 'Candidat',
      email: 'Email non disponible',
      joinDate: new Date().toISOString().split('T')[0],
      matricule: 'N/A',
      final_test_seuil: this.acceptanceThreshold,
      percentage: 0,
      test1_percentage: 0,
      test2_percentage: 0,
      final_test_percentage: 0,
      final_test_score: 0,
      final_test_total: 0,
      final_test_duration: 0,
      status: 'active',
      ville_origine: 'Non renseignée',
      contract_signed_date: 'Non renseignée',
      detailed_debug: { final_test: { has_result: false } }
    };
  }

  /**
   * Récupérer les données de progression
   */
  fetchProgressData(): Promise<void> {
    const headers = this.getHttpHeaders();
    const candidateId = this.routeCandidateId || this.getCandidateId();
    
    if (!candidateId) {
      console.warn('ProfilComponent - ID candidat manquant pour les données de progression');
      this.progressData = this.getDefaultProgressData();
      return Promise.resolve();
    }
    
    const url = `${this.baseUrl}/progress?candidate_id=${candidateId}`;
    console.log('ProfilComponent - URL pour les données de progression:', url);
    
    return this.http.get<any>(url, { headers }).toPromise()
      .then(progressInfo => {
        if (progressInfo && progressInfo.success && progressInfo.progress) {
          this.progressData = {
            totalModules: progressInfo.progress.totalModules || 0,
            completedModules: progressInfo.progress.completedModules || 0,
            dailyTestScores: progressInfo.progress.dailyTestScores || [],
            totalTimeSpent: progressInfo.progress.totalTimeSpent || 0,
            achievements: progressInfo.progress.achievements || [],
            weeklyProgress: progressInfo.progress.weeklyProgress || [],
            currentStreak: progressInfo.progress.currentStreak || 0,
            bestStreak: progressInfo.progress.bestStreak || 0
          };
          console.log('ProfilComponent - données de progression récupérées:', this.progressData);
        } else {
          console.warn('ProfilComponent - format de réponse inattendu pour progress:', progressInfo);
          this.progressData = this.getDefaultProgressData();
        }
      })
      .catch(error => {
        console.error('ProfilComponent - erreur lors de la récupération des données de progression:', error);
        if (error.status === 401) {
          this.logout();
        }
        this.progressData = this.getDefaultProgressData();
      });
  }

  /**
   * Récupérer les données du candidat depuis l'API
   */
  async fetchCandidateFromAPI(candidateId: string): Promise<void> {
    const headers = this.getHttpHeaders();
    if (!candidateId) {
      throw new Error('ID du candidat non trouvé');
    }

    try {
      const url = `${this.baseUrl}/candidate/${candidateId}`;
      console.log('ProfilComponent - URL pour les données candidat:', url);
      
      const response = await this.http.get<any>(url, { headers }).toPromise();
      
      if (response && response.success && response.candidate) {
        const apiCandidateInfo = this.formatCandidateInfo(response.candidate);
        if (this.candidateInfo) {
          this.candidateInfo = { ...this.candidateInfo, ...apiCandidateInfo };
        } else {
          this.candidateInfo = apiCandidateInfo;
        }
        this.candidateInfo.final_test_seuil = this.acceptanceThreshold;
        console.log('ProfilComponent - données candidat récupérées depuis l\'API:', this.candidateInfo);
      } else {
        throw new Error('Réponse API invalide ou aucun candidat trouvé');
      }
    } catch (error) {
      console.warn('ProfilComponent - endpoint candidat non disponible:', error);
      throw error;
    }
  }

  /**
   * Générer des scores de test basés sur les données de progression
   */
  generateTestScoresFromProgressData(): void {
    if (!this.progressData || !this.candidateInfo) {
      return;
    }

    if (this.progressData.dailyTestScores && this.progressData.dailyTestScores.length > 0) {
      this.testScores = this.progressData.dailyTestScores.map((dailyScore, index) => ({
        date: dailyScore.date,
        score: dailyScore.score,
        total: dailyScore.total,
        percentage: dailyScore.percentage,
        module: dailyScore.module,
        type: this.getTestType(index)
      }));

      this.updateCandidateScoresFromTestScores();
    }
  }

  /**
   * Déterminer le type de test basé sur l'index
   */
  getTestType(index: number): 'test1' | 'test2' | 'final_test' {
    const remainder = index % 3;
    switch (remainder) {
      case 0: return 'test1';
      case 1: return 'test2';
      default: return 'final_test';
    }
  }

  /**
   * Mettre à jour les scores du candidat basé sur les scores de test
   */
  updateCandidateScoresFromTestScores(): void {
    if (!this.candidateInfo || !this.testScores.length) {
      return;
    }

    const test1Scores = this.testScores.filter(score => score.type === 'test1');
    const test2Scores = this.testScores.filter(score => score.type === 'test2');
    const finalTestScores = this.testScores.filter(score => score.type === 'final_test');

    if (test1Scores.length > 0) {
      const avgTest1 = test1Scores.reduce((sum, score) => sum + score.percentage, 0) / test1Scores.length;
      this.candidateInfo.test1_percentage = Math.round(avgTest1 * 10) / 10;
    }

    if (test2Scores.length > 0) {
      const avgTest2 = test2Scores.reduce((sum, score) => sum + score.percentage, 0) / test2Scores.length;
      this.candidateInfo.test2_percentage = Math.round(avgTest2 * 10) / 10;
    }

    if (finalTestScores.length > 0) {
      const avgFinalTest = finalTestScores.reduce((sum, score) => sum + score.percentage, 0) / finalTestScores.length;
      this.candidateInfo.final_test_percentage = Math.round(avgFinalTest * 10) / 10;
    }

    const allPercentages = this.testScores.map(score => score.percentage);
    if (allPercentages.length > 0) {
      this.candidateInfo.percentage = Math.round((allPercentages.reduce((sum, perc) => sum + perc, 0) / allPercentages.length) * 10) / 10;
    }

    this.candidateInfo.final_test_seuil = this.acceptanceThreshold;
  }

  /**
   * Vérifier si le candidat est accepté
   */
  isCandidateAccepted(): boolean {
    if (!this.candidateInfo || 
        this.candidateInfo.final_test_percentage === undefined || 
        this.candidateInfo.final_test_seuil === undefined ||
        !this.candidateInfo.detailed_debug?.final_test?.has_result) {
      return false;
    }
    return this.candidateInfo.final_test_percentage >= this.candidateInfo.final_test_seuil;
  }

  /**
   * Obtenir le statut du test final
   */
  getCandidateStatus(): 'accepted' | 'rejected' | 'pending' | 'in_progress' {
    if (!this.candidateInfo || !this.candidateInfo.detailed_debug?.final_test) {
      return 'pending';
    }
    if (!this.candidateInfo.detailed_debug.final_test.has_result) {
      return this.candidateInfo.final_test_duration ? 'in_progress' : 'pending';
    }
    return this.isCandidateAccepted() ? 'accepted' : 'rejected';
  }

  /**
   * Obtenir la classe CSS pour le badge de statut
   */
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

  /**
   * Obtenir le texte du statut
   */
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

  /**
   * Formater les pourcentages
   */
  formatPercentage(percentage: string | number | undefined): string {
    if (percentage === undefined || percentage === null) {
      return '0.0%';
    }
    if (typeof percentage === 'string' && percentage.includes('%')) {
      return percentage;
    }
    return `${Number(percentage).toFixed(1)}%`;
  }

  /**
   * Formater les dates
   */
  formatDate(dateInput: any): string {
    if (!dateInput) return 'Non spécifiée';
    
    try {
      let dateStr: string;
      if (typeof dateInput === 'object' && dateInput !== null && '$date' in dateInput) {
        dateStr = dateInput.$date;
      } else {
        dateStr = dateInput;
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error('ProfilComponent - erreur lors du formatage de la date:', e);
      return 'Date invalide';
    }
  }

  /**
   * Formater la durée (en secondes pour final_test_duration, en minutes pour totalTimeSpent)
   */

formatTime(seconds: number, isFinalTest: boolean = false): string {
  if (isFinalTest) {
    // Si moins d'une minute, afficher en secondes
    if (seconds < 60) {
      return `${seconds}sec`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (secs === 0) {
      return `${minutes}min`;
    } else {
      return `${minutes}min ${secs}sec`;
    }
  } else {
    // Si moins d'une minute, afficher en secondes
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    // Si moins d'une heure
    if (hours === 0) {
      if (remainingSeconds === 0) {
        return `${minutes} min`;
      } else {
        return `${minutes} min ${remainingSeconds} sec`;
      }
    }
    
    // Si une heure ou plus
    if (minutes === 0 && remainingSeconds === 0) {
      return `${hours}h`;
    } else if (remainingSeconds === 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    } else {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${remainingSeconds}s`;
    }
  }
}
  /**
   * Déconnexion
   */
  logout(): void {
    console.log('ProfilComponent - déconnexion du candidat');
    localStorage.removeItem('candidateToken');
    localStorage.removeItem('candidateId');
    localStorage.removeItem('candidateInfo');
    this.authService.logout();
    this.router.navigate(['/candidateLogin']);
  }

  // === MÉTHODES UTILITAIRES ===

  private getStoredCandidateInfo(): any {
    const candidateInfo = localStorage.getItem('candidateInfo');
    const candidateId = localStorage.getItem('candidateId');
    
    if (candidateInfo) {
      try {
        const parsed = JSON.parse(candidateInfo);
        console.log('ProfilComponent - informations candidat depuis localStorage:', parsed);
        return parsed;
      } catch (e) {
        console.error('ProfilComponent - erreur lors du parsing des informations candidat:', e);
      }
    }
    
    if (candidateId) {
      return { id: candidateId };
    }
    
    return null;
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

  private getAuthToken(): string | null {
    // Prioriser le token du formateur si l'utilisateur est un formateur consultant un autre candidat
    const trainerToken = localStorage.getItem('trainerToken');
    if (this.routeCandidateId && trainerToken) {
      console.log('ProfilComponent - Utilisation du token du formateur');
      return trainerToken;
    }
    // Sinon, utiliser le token du candidat
    return this.authService.getAuthToken() || localStorage.getItem('candidateToken');
  }

  private getHttpHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = this.getAuthToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getCandidateId(): string {
    // Prioriser l'ID de la route si disponible, sinon utiliser l'ID du candidat connecté
    return this.routeCandidateId || this.authService.getCandidateId() || localStorage.getItem('candidateId') || '';
  }

  private getDefaultProgressData(): ProgressData {
    return {
      totalModules: 12,
      completedModules: 0,
      dailyTestScores: [],
      totalTimeSpent: 0,
      achievements: [
        { id: '1', name: 'Bienvenue', description: 'Connexion à la plateforme', earned: true, date: new Date().toISOString().split('T')[0] }
      ],
      weeklyProgress: [
        { week: 'Cette semaine', completion: 0, time: 0 }
      ],
      currentStreak: 0,
      bestStreak: 0
    };
  }

  // === MÉTHODES D'INTERFACE ===

  getCompletionPercentage(): number {
    if (!this.progressData) return 0;
    return Math.round((this.progressData.completedModules / this.progressData.totalModules) * 100);
  }

  getAverageScore(): number {
    if (!this.progressData || this.progressData.dailyTestScores.length === 0) return 0;
    const total = this.progressData.dailyTestScores.reduce((sum, test) => sum + test.percentage, 0);
    return Math.round((total / this.progressData.dailyTestScores.length) * 10) / 10;
  }

  selectTab(tab: 'overview' | 'progress' | 'achievements' | 'analytics' | 'profile'): void {
    this.selectedTab = tab;
  }

  retryFetch(): void {
    this.initializeCandidateProfile();
  }

  getInitials(): string {
    if (!this.candidateInfo?.name) return 'U';
    
    const names = this.candidateInfo.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return this.candidateInfo.name.charAt(0).toUpperCase();
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= this.acceptanceThreshold) return 'score-good';
    return 'score-poor';
  }

  getFormattedDate(dateString: string): string {
    return this.formatDate(dateString);
  }

  getScoreBarHeight(score: number): string {
    return `${(score / 100) * 200}px`;
  }

  getProgressBarWidth(percentage: number): string {
    return `${Math.min(100, Math.max(0, percentage))}%`;
  }

  getLastFiveScores(): Array<{ date: string; score: number; module: string; total: number; percentage: number }> {
    return this.progressData?.dailyTestScores?.slice(-5) || [];
  }

  hasTestScores(): boolean {
    return this.testScores.length > 0;
  }

  getBestScore(): number {
    if (!this.testScores.length) return 0;
    return Math.max(...this.testScores.map(score => score.percentage));
  }

  getAverageTestScore(): number {
    if (!this.testScores.length) return 0;
    const total = this.testScores.reduce((sum, score) => sum + score.percentage, 0);
    return Math.round((total / this.testScores.length) * 10) / 10;
  }

  refreshProfile(): void {
    this.initializeCandidateProfile();
  }

  hasCompleteProfile(): boolean {
    return !!(this.candidateInfo?.name && 
              this.candidateInfo?.email && 
              this.candidateInfo?.name !== 'Nom non disponible' &&
              this.candidateInfo?.email !== 'Email non disponible');
  }

  // === MÉTHODES POUR AFFICHER LES INFOS ===

  getCandidateName(): string {
    return this.candidateInfo?.name || 'Nom non disponible';
  }

  getCandidateEmail(): string {
    return this.candidateInfo?.email || 'Email non disponible';
  }

  getCandidateMatricule(): string {
    return this.candidateInfo?.matricule || 'Non renseigné';
  }

  getCandidateTelephone(): string {
    return this.candidateInfo?.telephone || 'Non renseigné';
  }

  getCandidateAdresse(): string {
    return this.candidateInfo?.adresse || 'Non renseignée';
  }

  getCandidateDateNaissance(): string {
    if (!this.candidateInfo?.dateNaissance) return 'Non renseignée';
    return this.formatDate(this.candidateInfo.dateNaissance);
  }

  getCandidateNiveau(): string {
    return this.candidateInfo?.niveau || 'Non renseigné';
  }

  getCandidateFiliere(): string {
    return this.candidateInfo?.filiere || 'Non renseignée';
  }

  getCandidateEtablissement(): string {
    return this.candidateInfo?.etablissement || 'Non renseigné';
  }

  getJoinDate(): string {
    if (!this.candidateInfo?.joinDate) return 'Date non disponible';
    return this.formatDate(this.candidateInfo.joinDate);
  }

  getLastActivity(): string {
    if (!this.candidateInfo?.lastActivity) return 'Inconnue';
    return this.formatDate(this.candidateInfo.lastActivity);
  }

  getTest1Percentage(): string {
    return this.formatPercentage(this.candidateInfo?.test1_percentage);
  }

  getTest2Percentage(): string {
    return this.formatPercentage(this.candidateInfo?.test2_percentage);
  }

  getFinalTestPercentage(): string {
    return this.formatPercentage(this.candidateInfo?.final_test_percentage);
  }

  getGlobalPercentage(): string {
    return this.formatPercentage(this.candidateInfo?.percentage);
  }

  getAcceptanceThreshold(): string {
    return this.formatPercentage(this.candidateInfo?.final_test_seuil);
  }

  getPointsToThreshold(): number {
    if (!this.candidateInfo || this.candidateInfo.final_test_percentage === undefined) {
      return this.acceptanceThreshold;
    }
    return Math.max(0, this.candidateInfo.final_test_seuil! - this.candidateInfo.final_test_percentage);
  }

  getVilleOrigine(): string {
    return this.candidateInfo?.ville_origine || 'Non renseignée';
  }

  getContractSignedDate(): string {
    if (!this.candidateInfo?.contract_signed_date) return 'Non renseignée';
    return this.formatDate(this.candidateInfo.contract_signed_date);
  }

  getFinalTestScore(): string {
    if (!this.candidateInfo || this.candidateInfo.final_test_score === undefined || this.candidateInfo.final_test_total === undefined) {
      return 'Non disponible';
    }
    return `${this.candidateInfo.final_test_score}/${this.candidateInfo.final_test_total}`;
  }

  getFinalTestDuration(): string {
    if (!this.candidateInfo || this.candidateInfo.final_test_duration === undefined) {
      return 'Non disponible';
    }
    return this.formatTime(this.candidateInfo.final_test_duration, true);
  }
}