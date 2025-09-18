import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { catchError, finalize, Observable, of, map } from 'rxjs';
import { Chart, ChartConfiguration, ChartType, TooltipItem, registerables } from 'chart.js';

// Enregistrer les composants Chart.js
Chart.register(...registerables);

interface CandidateListResponse {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  user_type: string;
  created_at?: string;
}

interface Candidate {
  _id: string;
  nom: string;
  email: string;
  percentage: number;
  date?: string;
  created_at?: string;
  departement?: string;
  score?: number;
  total?: number;
  test1_score?: number;
  test1_total?: number;
  test1_percentage?: number;
  test2_score?: number;
  test2_total?: number;
  test2_percentage?: number;
  final_test_score?: number;
  final_test_total?: number;
  final_test_percentage: number;
  test1?: { percentage: number };
  test2?: { percentage: number };
  final_test?: { percentage: number };
  final_test_seuil?: number;
}

interface HighestScore {
  percentage: number | string;
  candidateName: string;
  score: number;
  totalPossible: number;
  testType?: string;
}

interface Stats {
  closed_exams: number;
  in_progress_exams: number;
  highest_score: HighestScore;
  total_test1?: number;
  total_test2?: number;
  total_final_test?: number;
  accepted_candidates_count: number;
  accepted_candidates: Candidate[];
}

interface ApiResponse {
  success: boolean;
  stats: {
    closed_exams: number;
    in_progress_exams: number;
    highest_score: {
      percentage: number;
      candidateName: string;
      score: number;
      totalPossible: number;
    };
    accepted_candidates: Candidate[];
    accepted_candidates_count: number;
  };
  candidates: Candidate[];
}

// Interface pour la réponse du seuil
interface ThresholdResponse {
  success: boolean;
  threshold: number;
  default_threshold?: number;
  recent_threshold?: number;
  message?: string;
  error?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  toggleSidebar() {
    throw new Error('Method not implemented.');
  }
  
  candidates: Candidate[] = [];
  totalCandidates: number = 0;
  isLoading: boolean = false;
  error: string | null = null;
  finishedTests: number = 0;
  inProgressTests: number = 0;
  highestScore: HighestScore | null = null;
  
  editingCandidate: Candidate | null = null;

  // Variables pour les scores des tests individuels
  testScores: {
    test1_total: number;
    test2_total: number;
    final_test_total: number;
    test1_avg_score: number;
    test2_avg_score: number;
    final_test_avg_score: number;
  } = {
    test1_total: 0,
    test2_total: 0,
    final_test_total: 0,
    test1_avg_score: 0,
    test2_avg_score: 0,
    final_test_avg_score: 0
  };

  // Variables pour le suivi des candidats acceptés/refusés
  acceptedCandidatesCount: number = 0;
  rejectedCandidatesCount: number = 0;

  // Seuil d'acceptation (pourcentage minimum requis) - maintenant dynamique
  acceptanceThreshold!: number; // Valeur par défaut, sera mise à jour depuis le backend
  thresholdLoading: boolean = false;
  thresholdError: string | null = null;

  // Initialiser stats avec une structure complète incluant accepted_candidates
  stats: Stats = {
    closed_exams: 0,
    in_progress_exams: 0,
    highest_score: {
      percentage: 0,
      candidateName: '',
      score: 0,
      totalPossible: 0,
    },
    accepted_candidates_count: 0,
    accepted_candidates: []
  };
  
  loading: boolean = true;

  editForm: {
    nom: string;
    email: string;
    password: string;
  } = {
    nom: '',
    email: '',
    password: ''
  };

  // ViewChild references
  @ViewChild('testScoresChart') testScoresChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('candidatesStatusChart') candidatesStatusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('testProgressionChart') testProgressionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('departmentDistributionChart') departmentDistributionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('candidateTestScoresChart') candidateTestScoresChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('candidateProgressChart') candidateProgressChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('scoreDistributionChart') scoreDistributionChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('performanceTrendChart') performanceTrendChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('completionRateChart') completionRateChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('testComparisonChart') testComparisonChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('monthlyProgressChart') monthlyProgressChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('candidateRankingChart') candidateRankingChartRef!: ElementRef<HTMLCanvasElement>;
@ViewChild('passFailTrendChart') passFailTrendChartRef!: ElementRef<HTMLCanvasElement>;
  // Variables pour stocker les instances des graphiques
  private testScoresChart: Chart | null = null;
  private candidatesStatusChart: Chart | null = null;
  private testProgressionChart: Chart | null = null;
  private departmentDistributionChart: Chart | null = null;
  private candidateTestScoresChart: Chart | null = null;
  private candidateProgressChart: Chart | null = null;
  private scoreDistributionChart: Chart | null = null;
private performanceTrendChart: Chart | null = null;
private completionRateChart: Chart | null = null;
private testComparisonChart: Chart | null = null;
private monthlyProgressChart: Chart | null = null;
private candidateRankingChart: Chart | null = null;
private passFailTrendChart: Chart | null = null;
  private apiUrl = 'https://training-backend-1pda.onrender.com';

  selectedCandidate: Candidate | null = null;
  isSidebarOpen: any;

  constructor(private http: HttpClient, private router: Router) {
    console.log('DashboardComponent - constructeur appelé');
  }
  
  ngOnInit(): void {
    console.log('DashboardComponent - initialisation');
    
    // Vérifier si le formateur est authentifié
    if (!this.isTrainerAuthenticated()) {
      console.warn('DashboardComponent - formateur non authentifié, redirection vers login');
      this.router.navigate(['/trainer-login']);
      return;
    }
    
    console.log('DashboardComponent - formateur authentifié, chargement des données');
    // Charger d'abord le seuil, puis initialiser les données
    this.loadThresholdAndInitialize();
  }
  
  ngAfterViewInit(): void {
    console.log('DashboardComponent - afterViewInit');
  }
  
  formatPercentage(percentage: string | number): string {
    if (typeof percentage === 'string' && percentage.includes('%')) {
      return percentage;
    }
    return `${Number(percentage).toFixed(1)}%`;
  }
  
  private isTrainerAuthenticated(): boolean {
    const token = localStorage.getItem('trainerToken');
    return !!token;
  }

  /**
   * Nouvelle méthode pour charger le seuil depuis le backend
   */
  loadCurrentThreshold(): Observable<number> {
    console.log('DashboardComponent - chargement du seuil actuel depuis le backend');
    this.thresholdLoading = true;
    this.thresholdError = null;

    const token = localStorage.getItem('trainerToken');
    if (!token) {
      console.warn('DashboardComponent - token manquant pour charger le seuil');
      this.thresholdError = 'Token d\'authentification manquant';
      this.thresholdLoading = false;
      return of(75); // Valeur par défaut
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('DashboardComponent - envoi de la requête vers:', `${this.apiUrl}/api/settings/threshold/current`);

    return this.http.get<ThresholdResponse>(`${this.apiUrl}/api/settings/threshold/current`, { headers })
      .pipe(
        // Transformer la réponse ThresholdResponse en number
        map((response: ThresholdResponse) => {
          console.log('DashboardComponent - réponse brute reçue:', response);
          
          if (response && response.success) {
            // Vérifier les différents champs possibles
            let thresholdValue: number | undefined;
            
            if (typeof response.threshold === 'number') {
              thresholdValue = response.threshold;
              console.log(`DashboardComponent - seuil trouvé dans response.threshold: ${thresholdValue}`);
            } else if (typeof response.default_threshold === 'number') {
              thresholdValue = response.default_threshold;
              console.log(`DashboardComponent - seuil trouvé dans response.default_threshold: ${thresholdValue}`);
            } else if (typeof response.recent_threshold === 'number') {
              thresholdValue = response.recent_threshold;
              console.log(`DashboardComponent - seuil trouvé dans response.recent_threshold: ${thresholdValue}`);
            }
            
            if (thresholdValue !== undefined) {
              console.log(`DashboardComponent - seuil récupéré avec succès: ${thresholdValue}%`);
              return thresholdValue;
            } else {
              console.warn('DashboardComponent - aucun seuil valide trouvé dans la réponse, utilisation de la valeur par défaut');
              console.log('DashboardComponent - champs disponibles:', Object.keys(response));
              return 75;
            }
          } else {
            console.error('DashboardComponent - réponse invalide ou success=false:', response);
            return 75;
          }
        }),
        catchError(err => {
          console.error('DashboardComponent - erreur lors du chargement du seuil:', err);
          console.error('DashboardComponent - détails de l\'erreur:', {
            status: err.status,
            statusText: err.statusText,
            error: err.error,
            message: err.message,
            url: err.url
          });
          
          this.thresholdError = 'Erreur lors du chargement du seuil: ' + (err.error?.message || err.message);
          
          if (err.status === 401) {
            console.warn('DashboardComponent - erreur 401 lors du chargement du seuil, déconnexion');
            this.logout();
          }
          
          // Retourner la valeur par défaut en cas d'erreur
          console.log('DashboardComponent - retour de la valeur par défaut (75) à cause de l\'erreur');
          return of(75);
        }),
        finalize(() => {
          this.thresholdLoading = false;
          console.log(`DashboardComponent - chargement du seuil terminé, thresholdLoading=${this.thresholdLoading}`);
        })
      );
  }

  /**
   * Méthode pour charger le seuil et initialiser les données
   */
  loadThresholdAndInitialize(): void {
    console.log('DashboardComponent - début du chargement du seuil et initialisation');
    
    this.loadCurrentThreshold().subscribe({
      next: (threshold: number) => {
        this.acceptanceThreshold = threshold;
        console.log(`DashboardComponent - seuil récupéré avec succès: ${this.acceptanceThreshold}%`);
        
        // Maintenant initialiser les données avec le bon seuil
        this.initializeTestScoresView();
      },
      error: (error) => {
        console.error('DashboardComponent - erreur lors du chargement du seuil:', error);
        this.acceptanceThreshold = 75; // Valeur par défaut en cas d'erreur
        this.thresholdError = 'Impossible de charger le seuil, utilisation de la valeur par défaut (75%)';
        
        // Continuer avec la valeur par défaut
        this.initializeTestScoresView();
      }
    });
  }

  /**
   * Méthode pour recharger le seuil (utile si vous voulez permettre une actualisation manuelle)
   */
  refreshThreshold(): void {
    console.log('DashboardComponent - actualisation manuelle du seuil');
    this.loadCurrentThreshold().subscribe({
      next: (threshold: number) => {
        const oldThreshold = this.acceptanceThreshold;
        this.acceptanceThreshold = threshold;
        
        console.log(`DashboardComponent - seuil mis à jour de ${oldThreshold}% à ${this.acceptanceThreshold}%`);
        
        // Recalculer les statuts des candidats si le seuil a changé
        if (oldThreshold !== this.acceptanceThreshold) {
          this.recalculateCandidateStatuses();
          // Actualiser les graphiques qui dépendent du seuil
          this.initializeCharts();
        }
      },
      error: (error) => {
        console.error('DashboardComponent - erreur lors de l\'actualisation du seuil:', error);
      }
    });
  }

  /**
   * Recalcule les statuts des candidats après un changement de seuil
   */
  

  get acceptedCandidates(): Candidate[] {
    return this.candidates.filter(candidate => this.isCandidateAccepted(candidate));
  }

  loadCandidates(): void {
    console.log('DashboardComponent - début du chargement des candidats');
    this.isLoading = true;
    this.error = null;

    const token = localStorage.getItem('trainerToken');
    console.log('DashboardComponent - token utilisé pour la requête:', token ? 'présent' : 'absent');
    
    if (!token) {
      this.error = 'Token d\'authentification manquant';
      this.isLoading = false;
      this.router.navigate(['/trainer-login']);
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('DashboardComponent - envoi de la requête GET pour les candidats');
    
    this.http.get<CandidateListResponse[]>(`${this.apiUrl}/auth/candidates`, { headers })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        catchError(err => {
          console.error("DashboardComponent - erreur lors du chargement des candidats:", err);
          console.error("DashboardComponent - détails de l'erreur:", err.error || err.message);
          console.error("DashboardComponent - statut HTTP:", err.status);
          
          this.error = 'Erreur lors du chargement des candidats: ' + (err.error?.message || err.message);
          
          if (err.status === 401) {
            console.warn("DashboardComponent - erreur 401, token invalide ou expiré");
            this.logout();
          }
          
          return of([]);
        })
      )
      .subscribe(response => {
        console.log("DashboardComponent - données de candidats reçues:", response);
        
        if (Array.isArray(response)) {
          // Mapper les données reçues à l'interface Candidate en utilisant le seuil dynamique
          this.candidates = response.map((item: CandidateListResponse) => ({
            _id: item.id.toString(),
            nom: item.nom,
            email: item.email,
            created_at: item.created_at,
            percentage: 0,
            date: '',
            final_test_seuil: this.acceptanceThreshold, // Utiliser le seuil dynamique
            test1_percentage: 0,
            test2_percentage: 0,
            final_test_percentage: 0
          }));
          this.totalCandidates = this.candidates.length;
        } else {
          console.warn("DashboardComponent - réponse inattendue, format non-tableau:", response);
          this.candidates = [];
          this.totalCandidates = 0;
          this.error = 'Format de réponse inattendu du serveur';
        }
        
        console.log(`DashboardComponent - ${this.totalCandidates} candidats chargés avec seuil ${this.acceptanceThreshold}%`);
        
        // Charger les statistiques pour compléter les scores
        this.fetchStats();
      });
  }

  logout(): void {
    console.log('DashboardComponent - déconnexion du formateur');
    localStorage.removeItem('trainerToken');
    localStorage.removeItem('trainerId');
    localStorage.removeItem('trainerInfo');
    console.log('DashboardComponent - données formateur supprimées, redirection vers login');
    this.router.navigate(['/trainerLogin']);
  }

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
      console.error('Erreur lors du formatage de la date:', e);
      return 'Date invalide';
    }
  }

  prepareTestScoresData(): void {
    if (!this.candidates || this.candidates.length === 0) {
      console.log('DashboardComponent - aucun candidat à préparer');
      return;
    }
    
    console.log('DashboardComponent - préparation des données de test pour', this.candidates.length, 'candidats avec seuil', this.acceptanceThreshold);
    
    // Pour chaque candidat, calculer ou récupérer les scores de tests individuels
    this.candidates.forEach(candidate => {
      // Mettre à jour le seuil pour tous les candidats
      candidate.final_test_seuil = this.acceptanceThreshold;
      
      // Vérifier si les pourcentages sont déjà définis directement
      if (!candidate.test1_percentage && candidate.test1_score && candidate.test1_total) {
        candidate.test1_percentage = (candidate.test1_score / candidate.test1_total) * 100;
      }
      
      if (!candidate.test2_percentage && candidate.test2_score && candidate.test2_total) {
        candidate.test2_percentage = (candidate.test2_score / candidate.test2_total) * 100;
      }
      
      if (!candidate.final_test_percentage && candidate.final_test_score && candidate.final_test_total) {
        candidate.final_test_percentage = (candidate.final_test_score / candidate.final_test_total) * 100;
      }
      
      // Vérifier si les pourcentages sont dans des objets imbriqués
      if (!candidate.test1_percentage && candidate.test1 && candidate.test1.percentage !== undefined) {
        candidate.test1_percentage = candidate.test1.percentage;
      }
      
      if (!candidate.test2_percentage && candidate.test2 && candidate.test2.percentage !== undefined) {
        candidate.test2_percentage = candidate.test2.percentage;
      }
      
      if (!candidate.final_test_percentage && candidate.final_test && candidate.final_test.percentage !== undefined) {
        candidate.final_test_percentage = candidate.final_test.percentage;
      }
      
      // Si le pourcentage global n'est pas défini mais que score et total le sont
      if (!candidate.percentage && candidate.score !== undefined && candidate.total !== undefined && candidate.total > 0) {
        candidate.percentage = (candidate.score / candidate.total) * 100;
      }
      
      // Assurez-vous qu'il y a au moins un pourcentage global par défaut
      if (!candidate.percentage) {
        candidate.percentage = 0;
      }
      
      console.log(`DashboardComponent - candidat ${candidate.nom} préparé avec pourcentage ${candidate.percentage}% (seuil: ${this.acceptanceThreshold}%)`);
    });
  }
  
 
  
  /**
   * Méthode à appeler dans ngOnInit
   */
  initializeTestScoresView(): void {
    // Charger d'abord les candidats, puis fetchStats sera appelé dans le callback
    this.loadCandidates();
  }
  


  initializeCharts(): void {
    console.log('DashboardComponent - initialisation des graphiques');
    
    if (this.candidates && this.candidates.length > 0) {
      this.createTestScoresChart();
      this.createCandidatesStatusChart();
      this.createTestProgressionChart();
      this.createDepartmentDistributionChart();
       this.createScoreDistributionChart();
    this.createPerformanceTrendChart();
    this.createCompletionRateChart();
    this.createTestComparisonChart();
    this.createMonthlyProgressChart();
    this.createCandidateRankingChart();
    this.createPassFailTrendChart();
    } else {
      console.warn('DashboardComponent - pas de données pour créer les graphiques');
    }
  }
  createScoreDistributionChart(): void {
  if (!this.scoreDistributionChartRef) {
    console.warn('DashboardComponent - référence au canvas scoreDistributionChart non disponible');
    return;
  }

  if (this.scoreDistributionChart) {
    this.scoreDistributionChart.destroy();
  }

  // Créer des intervalles pour la distribution des scores
  const intervals = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
  const distribution = [0, 0, 0, 0, 0];

  this.candidates.forEach(candidate => {
    const score = candidate.final_test_percentage || candidate.percentage || 0;
    if (score <= 20) distribution[0]++;
    else if (score <= 40) distribution[1]++;
    else if (score <= 60) distribution[2]++;
    else if (score <= 80) distribution[3]++;
    else distribution[4]++;
  });

  const ctx = this.scoreDistributionChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  this.scoreDistributionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: intervals,
      datasets: [{
        label: 'Number of Trainees',
        data: distribution,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Score Distribution',
          font: { size: 16, weight: 'bold' }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Number of Trainees' }
        },
        x: {
          title: { display: true, text: 'Score Range' }
        }
      }
    }
  });
}

/**
 * Graphique de tendance des performances (ligne temporelle)
 */


/**
 * Graphique de taux de complétion par test (doughnut)
 */
createCompletionRateChart(): void {
  if (!this.completionRateChartRef) return;

  if (this.completionRateChart) {
    this.completionRateChart.destroy();
  }

  const test1Completed = this.candidates.filter(c => c.test1_percentage !== undefined).length;
  const test2Completed = this.candidates.filter(c => c.test2_percentage !== undefined).length;
  const finalCompleted = this.candidates.filter(c => c.final_test_percentage !== undefined).length;

  const ctx = this.completionRateChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  this.completionRateChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Day 1 Test', 'Day 2 Test', 'Final Test'],
      datasets: [{
        data: [test1Completed, test2Completed, finalCompleted],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Test Completion Rates',
          font: { size: 16, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              const percentage = Math.round((value / this.totalCandidates) * 100);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Graphique de comparaison des moyennes par test (radar)
 */
createTestComparisonChart(): void {
  if (!this.testComparisonChartRef) return;

  if (this.testComparisonChart) {
    this.testComparisonChart.destroy();
  }

  // Calculer les moyennes
  const test1Avg = this.calculateAverageScore('test1_percentage');
  const test2Avg = this.calculateAverageScore('test2_percentage');
  const finalAvg = this.calculateAverageScore('final_test_percentage');

  const ctx = this.testComparisonChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  this.testComparisonChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Day 1 Test', 'Day 2 Test', 'Final Test'],
      datasets: [{
        label: 'Average Scores',
        data: [test1Avg, test2Avg, finalAvg],
        backgroundColor: 'rgba(153, 102, 255, 0.3)',
        borderColor: 'rgba(153, 102, 255, 1)',
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Test Performance Comparison',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    }
  });
}

createPerformanceTrendChart(): void {
  if (!this.performanceTrendChartRef) return;

  if (this.performanceTrendChart) {
    this.performanceTrendChart.destroy();
  }

  // Utiliser les vraies dates de passage de test des candidats
  const monthlyData: { [key: string]: { total: number, passed: number } } = {};
  
  // Filtrer les candidats qui ont une date de test final et un score
  const candidatesWithTestDate = this.candidates.filter(candidate => {
    const hasValidScore = candidate.final_test_percentage !== undefined && 
                         candidate.final_test_percentage !== null && 
                         !isNaN(Number(candidate.final_test_percentage));
    
    // Vérifier s'il y a une date disponible (date de test ou date de création)
    const hasDate = candidate.date || candidate.created_at;
    
    return hasValidScore && hasDate;
  });

  console.log(`Performance Trend: ${candidatesWithTestDate.length} candidats avec date de test trouvés`);
  
  candidatesWithTestDate.forEach(candidate => {
    // Utiliser la date de test en priorité, sinon la date de création
    let testDate: Date;
    const dateToUse = candidate.date || candidate.created_at;
    
    try {
      // Gérer différents formats de date
      if (typeof dateToUse === 'object' && dateToUse !== null && (dateToUse as any).$date) {
        testDate = new Date((dateToUse as any).$date);
      } else if (typeof dateToUse === 'string') {
        testDate = new Date(dateToUse);

      } else {
        testDate = new Date(dateToUse as any);
      }
      
      // Vérifier si la date est valide
      if (isNaN(testDate.getTime())) {
        console.warn(`Date invalide pour le candidat ${candidate.nom}:`, dateToUse);
        return;
      }
      
      const monthKey = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, passed: 0 };
      }
      
      monthlyData[monthKey].total++;
      if (this.isCandidateAccepted(candidate)) {
        monthlyData[monthKey].passed++;
      }
      
    } catch (error) {
      console.error(`Erreur lors du parsing de la date pour ${candidate.nom}:`, error);
    }
  });

  // Si pas de données avec dates valides, créer des données d'exemple
  if (Object.keys(monthlyData).length === 0) {
    console.warn('Aucune date de test valide trouvée, création de données d\'exemple');
    const currentDate = new Date();
    for (let i = 2; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyData[monthKey] = { total: 0, passed: 0 };
    }
  }

  const sortedMonths = Object.keys(monthlyData).sort();
  const passRates = sortedMonths.map(month => {
    const data = monthlyData[month];
    return data.total > 0 ? (data.passed / data.total) * 100 : 0;
  });

  // Convertir les clés de mois en format lisible
  const monthLabels = sortedMonths.map(monthKey => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  console.log('Performance Trend Data:', { sortedMonths, passRates, monthLabels });

  const ctx = this.performanceTrendChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  this.performanceTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Success Rate (%)',
        data: passRates,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Performance Trend Over Time (Based on Test Dates)',
          font: { size: 16, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const monthIndex = context.dataIndex;
              const monthKey = sortedMonths[monthIndex];
              const data = monthlyData[monthKey];
              return [
                `Success Rate: ${Number(context.raw).toFixed(1)}%`,
                `Passed: ${data.passed}/${data.total} candidates`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Success Rate (%)' },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          title: { display: true, text: 'Test Month' }
        }
      }
    }
  });
}

/**
 * Graphique de progression mensuelle (barres empilées) - VERSION CORRIGÉE
 */
createMonthlyProgressChart(): void {
  if (!this.monthlyProgressChartRef) return;

  if (this.monthlyProgressChart) {
    this.monthlyProgressChart.destroy();
  }

  // Utiliser les vraies dates de passage de test
  const monthlyStats: { [key: string]: { registered: number, passed: number, failed: number } } = {};
  
  // Analyser tous les candidats selon leur date de test
  this.candidates.forEach(candidate => {
    let testDate: Date | null = null;
    const dateToUse = candidate.date || candidate.created_at;
    
    if (dateToUse) {
      try {
        // Gérer différents formats de date
        if (typeof dateToUse === 'object' && dateToUse !== null && (dateToUse as any).$date) {
          testDate = new Date((dateToUse as any).$date);
        } else if (typeof dateToUse === 'string') {
          testDate = new Date(dateToUse);
        
        } else {
          testDate = new Date(dateToUse as any);
        }
        
        // Vérifier si la date est valide
        if (isNaN(testDate.getTime())) {
          console.warn(`Date invalide pour le candidat ${candidate.nom}:`, dateToUse);
          testDate = null;
        }
      } catch (error) {
        console.error(`Erreur lors du parsing de la date pour ${candidate.nom}:`, error);
        testDate = null;
      }
    }
    
    // Si pas de date valide, utiliser le mois actuel
    if (!testDate) {
      testDate = new Date();
    }
    
    const monthKey = testDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = { registered: 0, passed: 0, failed: 0 };
    }
    
    monthlyStats[monthKey].registered++;
    
    // Vérifier si le candidat a passé le test final
    if (candidate.final_test_percentage !== undefined && 
        candidate.final_test_percentage !== null &&
        !isNaN(Number(candidate.final_test_percentage))) {
      if (this.isCandidateAccepted(candidate)) {
        monthlyStats[monthKey].passed++;
      } else {
        monthlyStats[monthKey].failed++;
      }
    }
  });

  // Si pas de données, créer des données vides pour le mois actuel
  if (Object.keys(monthlyStats).length === 0) {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyStats[currentMonth] = { registered: 0, passed: 0, failed: 0 };
  }

  // Trier les mois chronologiquement
  const months = Object.keys(monthlyStats).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  const registeredData = months.map(m => monthlyStats[m].registered);
  const passedData = months.map(m => monthlyStats[m].passed);
  const failedData = months.map(m => monthlyStats[m].failed);

  console.log('Monthly Progress Data:', { months, registeredData, passedData, failedData });

  const ctx = this.monthlyProgressChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  this.monthlyProgressChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Registered',
          data: registeredData,
          backgroundColor: 'rgba(201, 203, 207, 0.8)',
          borderColor: 'rgba(201, 203, 207, 1)',
          borderWidth: 1
        },
        {
          label: 'Passed',
          data: passedData,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Failed',
          data: failedData,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Monthly Progress Overview (Based on Test Dates)',
          font: { size: 16, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const month = context.label;
              const stats = monthlyStats[month];
              if (context.datasetIndex === 0) { // Registered
                return `Total registered this month`;
              } else if (context.datasetIndex === 1) { // Passed
                const totalTested = stats.passed + stats.failed;
                const rate = totalTested > 0 ? ((stats.passed / totalTested) * 100).toFixed(1) : '0';
                return `Success rate: ${rate}%`;
              } else { // Failed
                const totalTested = stats.passed + stats.failed;
                const rate = totalTested > 0 ? ((stats.failed / totalTested) * 100).toFixed(1) : '0';
                return `Failure rate: ${rate}%`;
              }
            }
          }
        }
      },
      scales: {
        x: { 
          stacked: false,
          title: { display: true, text: 'Test Month' }
        },
        y: { 
          stacked: false,
          beginAtZero: true,
          title: { display: true, text: 'Number of Trainees' },
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

/**
 * Graphique de classement des meilleurs candidats
 */
createCandidateRankingChart(): void {
  if (!this.candidateRankingChartRef) return;

  if (this.candidateRankingChart) {
    this.candidateRankingChart.destroy();
  }

  // Trier les candidats par score final et prendre les 10 meilleurs
  const rankedCandidates = this.candidates
    .filter(c => c.final_test_percentage !== undefined)
    .sort((a, b) => (b.final_test_percentage || 0) - (a.final_test_percentage || 0))
    .slice(0, 10);

  const names = rankedCandidates.map(c => c.nom.length > 15 ? c.nom.substring(0, 15) + '...' : c.nom);
  const scores = rankedCandidates.map(c => c.final_test_percentage || 0);

  const ctx = this.candidateRankingChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  const chartConfig: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{
        label: 'Final Test Score (%)',
        data: scores,
        backgroundColor: scores.map(score => 
          score >= this.acceptanceThreshold ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
        ),
        borderColor: scores.map(score => 
          score >= this.acceptanceThreshold ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
        ),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y' as const,
      plugins: {
        title: {
          display: true,
          text: 'Top 10 Trainees Ranking',
          font: { size: 16, weight: 'bold' as const }
        },
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Score (%)' }
        }
      }
    }
  };

  this.candidateRankingChart = new Chart(ctx, chartConfig);
}


/**
 * Graphique de tendance réussite/échec par semaine
 */
createPassFailTrendChart(): void {
  if (!this.passFailTrendChartRef) return;

  if (this.passFailTrendChart) {
    this.passFailTrendChart.destroy();
  }

  // Simuler des données hebdomadaires
  const weeklyData: { [key: string]: { passed: number, failed: number } } = {};
  
  this.candidates
    .filter(c => c.final_test_percentage !== undefined && c.created_at)
    .forEach(candidate => {
      const date = new Date(candidate.created_at!);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { passed: 0, failed: 0 };
      }
      
      if (this.isCandidateAccepted(candidate)) {
        weeklyData[weekKey].passed++;
      } else {
        weeklyData[weekKey].failed++;
      }
    });

  const weeks = Object.keys(weeklyData).sort();
  const passedData = weeks.map(w => weeklyData[w].passed);
  const failedData = weeks.map(w => weeklyData[w].failed);

  const ctx = this.passFailTrendChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  this.passFailTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [
        {
          label: 'Passed',
          data: passedData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Failed',
          data: failedData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Weekly Pass/Fail Trend',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Number of Trainees' }
        }
      }
    }
  });
}

// 5. MÉTHODES UTILITAIRES

/**
 * Calcule la moyenne des scores pour un type de test donné
 */
private calculateAverageScore(testType: string): number {
  const validScores = this.candidates
    .map(c => Number((c as any)[testType]) || 0)
    .filter(score => score > 0);
  
  if (validScores.length === 0) return 0;
  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
}

/**
 * Détruit tous les nouveaux graphiques
 */
private destroyAdditionalCharts(): void {
  const charts = [
    this.scoreDistributionChart,
    this.performanceTrendChart,
    this.completionRateChart,
    this.testComparisonChart,
    this.monthlyProgressChart,
    this.candidateRankingChart,
    this.passFailTrendChart
  ];

  charts.forEach(chart => {
    if (chart) {
      chart.destroy();
    }
  });
}

// 6. MODIFIER LA MÉTHODE ngOnDestroy POUR NETTOYER LES GRAPHIQUES
ngOnDestroy(): void {
  // Détruire tous les graphiques existants
  if (this.testScoresChart) this.testScoresChart.destroy();
  if (this.candidatesStatusChart) this.candidatesStatusChart.destroy();
  if (this.testProgressionChart) this.testProgressionChart.destroy();
  if (this.departmentDistributionChart) this.departmentDistributionChart.destroy();
  if (this.candidateTestScoresChart) this.candidateTestScoresChart.destroy();
  if (this.candidateProgressChart) this.candidateProgressChart.destroy();
  
  // Détruire les nouveaux graphiques
  this.destroyAdditionalCharts();
}
  /**
   * Crée un graphique comparant les scores moyens pour chaque test
   */
  createTestScoresChart(): void {
    if (!this.testScoresChartRef) {
      console.warn('DashboardComponent - référence au canvas testScoresChart non disponible');
      return;
    }

    // Calcul des scores moyens pour chaque test
    let test1Avg = 0, test2Avg = 0, finalTestAvg = 0;
    let test1Count = 0, test2Count = 0, finalTestCount = 0;
    
    this.candidates.forEach(candidate => {
      if (candidate.test1_percentage !== undefined) {
        test1Avg += Number(candidate.test1_percentage);
        test1Count++;
      }
      if (candidate.test2_percentage !== undefined) {
        test2Avg += Number(candidate.test2_percentage);
        test2Count++;
      }
      if (candidate.final_test_percentage !== undefined) {
        finalTestAvg += Number(candidate.final_test_percentage);
        finalTestCount++;
      }
    });
    
    test1Avg = test1Count > 0 ? test1Avg / test1Count : 0;
    test2Avg = test2Count > 0 ? test2Avg / test2Count : 0;
    finalTestAvg = finalTestCount > 0 ? finalTestAvg / finalTestCount : 0;
    
    // Destruction du graphique existant s'il y en a un
    if (this.testScoresChart) {
      this.testScoresChart.destroy();
    }
    
    // Création du nouveau graphique
    const ctx = this.testScoresChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.testScoresChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Day 1 Test', 'Day 2 Test ', 'Final Test '],
        datasets: [{
          label: 'Score moyen (%)',
          data: [test1Avg, test2Avg, finalTestAvg],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Average Score per Test',
            color: '#333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Average Score: ${Number(context.raw).toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percent (%)'
            }
          }
        }
      }
    });
  }

 

  /**
   * Crée un graphique montrant la progression des tests
   */
  createTestProgressionChart(): void {
    if (!this.testProgressionChartRef) {
      console.warn('DashboardComponent - référence au canvas testProgressionChart non disponible');
      return;
    }
    
    // Préparation des données pour le graphique de progression
    const testCountData = [0, 0, 0]; // [Test1, Test2, TestFinal]
    
    this.candidates.forEach(candidate => {
      if (candidate.test1_percentage !== undefined) testCountData[0]++;
      if (candidate.test2_percentage !== undefined) testCountData[1]++;
      if (candidate.final_test_percentage !== undefined) testCountData[2]++;
    });
    
    // Destruction du graphique existant s'il y en a un
    if (this.testProgressionChart) {
      this.testProgressionChart.destroy();
    }
    
    // Création du nouveau graphique
    const ctx = this.testProgressionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.testProgressionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Day 1 Test', ' Day 2 Test ', 'Final Test '],
        datasets: [{
          label: 'Trainees who completed the test',
          data: testCountData,
          fill: false,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          tension: 0.1,
          pointBackgroundColor: 'rgba(153, 102, 255, 1)',
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Trainees Progression Through the Tests',
            color: '#333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = Math.max(...(context.chart.data.datasets[0].data as number[]));
                const percentage = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                return `${value} candidats (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Trainees'
            },
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /**
   * Crée un graphique montrant la distribution des candidats par département
   */
  createDepartmentDistributionChart(): void {
    if (!this.departmentDistributionChartRef) {
      console.warn('DashboardComponent - référence au canvas departmentDistributionChart non disponible');
      return;
    }
    
    // Destruction du graphique existant s'il y en a un
    if (this.departmentDistributionChart) {
      this.departmentDistributionChart.destroy();
    }

    // Analyser chaque test individuellement
    const testData = [
      { name: 'Day 1 Test', passed: 0, failed: 0, notTaken: 0 },
      { name: 'Day 2 Test', passed: 0, failed: 0, notTaken: 0 },
      { name: 'Final Test', passed: 0, failed: 0, notTaken: 0 }
    ];
    
    // Compter les candidats qui ont réussi/échoué/non pris chaque test
    this.candidates.forEach(candidate => {
      // Test 1
      if (candidate.test1_percentage !== undefined) {
        if (candidate.test1_percentage >= this.acceptanceThreshold) {
          testData[0].passed++;
        } else {
          testData[0].failed++;
        }
      } else {
        testData[0].notTaken++;
      }
      
      // Test 2
      if (candidate.test2_percentage !== undefined) {
        if (candidate.test2_percentage >= this.acceptanceThreshold) {
          testData[1].passed++;
        } else {
          testData[1].failed++;
        }
      } else {
        testData[1].notTaken++;
      }
      
      // Final Test
      if (candidate.final_test_percentage !== undefined) {
        if (candidate.final_test_percentage >= this.acceptanceThreshold) {
          testData[2].passed++;
        } else {
          testData[2].failed++;
        }
      } else {
        testData[2].notTaken++;
      }
    });
    
    const totalCandidates = this.candidates.length;
    
    // Créer un graphique à barres empilées
    const ctx = this.departmentDistributionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.departmentDistributionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: testData.map(t => t.name),
        datasets: [
          {
            label: 'Passed',
            data: testData.map(t => t.passed),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Failed',
            data: testData.map(t => t.failed),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'Not Taken',
            data: testData.map(t => t.notTaken),
            backgroundColor: 'rgba(201, 203, 207, 0.6)',
            borderColor: 'rgba(201, 203, 207, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Test Success Rates',
            color: '#333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                const percentage = Math.round((value / totalCandidates) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Test'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Trainees'
            },
            stacked: true
          }
        }
      }
    });
  }

  /**
   * Affiche les graphiques spécifiques à un candidat
   */
  showCandidateCharts(candidate: Candidate): void {
    this.selectedCandidate = candidate;
    
    // Attendre que les références canvas soient disponibles (après le rendu)
    setTimeout(() => {
      this.createCandidateTestScoresChart();
      this.createCandidateProgressChart();
    }, 100);
  }
  
  // Méthode pour fermer la vue des graphiques spécifiques
  closeSpecificCharts(): void {
    // Détruire les graphiques avant de fermer
    if (this.candidateTestScoresChart) {
      this.candidateTestScoresChart.destroy();
    }
    if (this.candidateProgressChart) {
      this.candidateProgressChart.destroy();
    }
    
    this.selectedCandidate = null;
  }
  
  /**
   * Crée un graphique comparant les scores du candidat sélectionné à la moyenne
   */
  createCandidateTestScoresChart(): void {
    if (!this.candidateTestScoresChartRef || !this.selectedCandidate) {
      console.warn('Référence au canvas candidateTestScoresChart non disponible ou aucun candidat sélectionné');
      return;
    }
    
    // Calcul des scores moyens pour chaque test (pour comparaison)
    let test1Avg = 0, test2Avg = 0, finalTestAvg = 0;
    let test1Count = 0, test2Count = 0, finalTestCount = 0;
    
    this.candidates.forEach(candidate => {
      if (candidate.test1_percentage !== undefined) {
        test1Avg += Number(candidate.test1_percentage);
        test1Count++;
      } else if (candidate.test1?.percentage !== undefined) {
        test1Avg += Number(candidate.test1.percentage);
        test1Count++;
      }
      
      if (candidate.test2_percentage !== undefined) {
        test2Avg += Number(candidate.test2_percentage);
        test2Count++;
      } else if (candidate.test2?.percentage !== undefined) {
        test2Avg += Number(candidate.test2.percentage);
        test2Count++;
      }
      
      if (candidate.final_test_percentage !== undefined) {
        finalTestAvg += Number(candidate.final_test_percentage);
        finalTestCount++;
      } else if (candidate.final_test?.percentage !== undefined) {
        finalTestAvg += Number(candidate.final_test.percentage);
        finalTestCount++;
      }
    });
    
    test1Avg = test1Count > 0 ? test1Avg / test1Count : 0;
    test2Avg = test2Count > 0 ? test2Avg / test2Count : 0;
    finalTestAvg = finalTestCount > 0 ? finalTestAvg / finalTestCount : 0;
    
    // Récupération des scores du candidat sélectionné
    const candidateTest1Score = 
      this.selectedCandidate.test1_percentage !== undefined ? 
      Number(this.selectedCandidate.test1_percentage) : 
      (this.selectedCandidate.test1?.percentage !== undefined ? 
       Number(this.selectedCandidate.test1.percentage) : 0);
    
    const candidateTest2Score = 
      this.selectedCandidate.test2_percentage !== undefined ? 
      Number(this.selectedCandidate.test2_percentage) : 
      (this.selectedCandidate.test2?.percentage !== undefined ? 
       Number(this.selectedCandidate.test2.percentage) : 0);
    
    const candidateFinalTestScore = 
      this.selectedCandidate.final_test_percentage !== undefined ? 
      Number(this.selectedCandidate.final_test_percentage) : 
      (this.selectedCandidate.final_test?.percentage !== undefined ? 
       Number(this.selectedCandidate.final_test.percentage) : 0);
    
    // Destruction du graphique existant s'il y en a un
    if (this.candidateTestScoresChart) {
      this.candidateTestScoresChart.destroy();
    }
    
    // Création du nouveau graphique
    const ctx = this.candidateTestScoresChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.candidateTestScoresChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Day 1 Test', 'Day 2 Test', 'Final Test'],
        datasets: [
          {
            label: `${this.selectedCandidate.nom}'s Score`,
            data: [candidateTest1Score, candidateTest2Score, candidateFinalTestScore],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Class Average',
            data: [test1Avg, test2Avg, finalTestAvg],
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${this.selectedCandidate.nom}'s Test Scores vs. Class Average`,
            color: '#333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw;
                return `${label}: ${value}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percent (%)'
            }
          }
        }
      }
    });
  }
  
  /**
   * Crée un graphique montrant la progression du candidat sélectionné
   */
  createCandidateProgressChart(): void {
    if (!this.candidateProgressChartRef || !this.selectedCandidate) {
      console.warn('Référence au canvas candidateProgressChart non disponible ou aucun candidat sélectionné');
      return;
    }
    
    // Récupération des scores du candidat sélectionné
    const candidateTest1Score = 
      this.selectedCandidate.test1_percentage !== undefined ? 
      Number(this.selectedCandidate.test1_percentage) : 
      (this.selectedCandidate.test1?.percentage !== undefined ? 
       Number(this.selectedCandidate.test1.percentage) : null);
    
    const candidateTest2Score = 
      this.selectedCandidate.test2_percentage !== undefined ? 
      Number(this.selectedCandidate.test2_percentage) : 
      (this.selectedCandidate.test2?.percentage !== undefined ? 
       Number(this.selectedCandidate.test2.percentage) : null);
    
    const candidateFinalTestScore = 
      this.selectedCandidate.final_test_percentage !== undefined ? 
      Number(this.selectedCandidate.final_test_percentage) : 
      (this.selectedCandidate.final_test?.percentage !== undefined ? 
       Number(this.selectedCandidate.final_test.percentage) : null);
    
    // Destruction du graphique existant s'il y en a un
    if (this.candidateProgressChart) {
      this.candidateProgressChart.destroy();
    }
    
    // Création du nouveau graphique
    const ctx = this.candidateProgressChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Préparer les données pour le graphique
    const labels = [];
    const data = [];
    
    if (candidateTest1Score !== null) {
      labels.push('Day 1 Test');
      data.push(candidateTest1Score);
    }
    
    if (candidateTest2Score !== null) {
      labels.push('Day 2 Test');
      data.push(candidateTest2Score);
    }
    
    if (candidateFinalTestScore !== null) {
      labels.push('Final Test');
      data.push(candidateFinalTestScore);
    }
    
    this.candidateProgressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Test Score Progression',
          data: data,
          fill: false,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          tension: 0.1,
          pointBackgroundColor: 'rgba(153, 102, 255, 1)',
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${this.selectedCandidate.nom}'s Test Score Progression`,
            color: '#333',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `Score: ${value}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percent (%)'
            }
          }
        }
      }
    });
  }
isCandidateAccepted(candidate: Candidate): boolean {
  // Vérifier d'abord si le candidat a passé le test final
  if (!candidate || candidate.final_test_percentage === undefined || candidate.final_test_percentage === null) {
    return false;
  }
  
  // Comparer avec le seuil dynamique
  return Number(candidate.final_test_percentage) >= this.acceptanceThreshold;
}

// 2. Correction de la méthode fetchStats pour bien calculer les candidats acceptés
fetchStats(): void {
  this.loading = true;
  console.log('DashboardComponent - début du chargement des statistiques');

  const token = localStorage.getItem('trainerToken');
  if (!token) {
    this.error = 'Token d\'authentification manquant';
    this.loading = false;
    this.initializeCharts();
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  this.http.get<ApiResponse>(`${this.apiUrl}/api/questions/get_all_candidates_scores`, { headers })
    .pipe(
      finalize(() => {
        this.loading = false;
      }),
      catchError(err => {
        this.error = err.message || 'Une erreur s\'est produite lors de la récupération des statistiques';
        console.error('DashboardComponent - erreur lors du chargement des statistiques:', err);
        return of({ 
          success: false, 
          stats: this.stats, 
          candidates: []
        } as ApiResponse);
      })
    )
    .subscribe(response => {
      if (response && response.success) {
        console.log('DashboardComponent - statistiques reçues avec succès:', response);
        
        // Mettre à jour les statistiques
        this.stats = response.stats;
        this.finishedTests = this.stats.closed_exams;
        this.inProgressTests = this.stats.in_progress_exams;
        this.highestScore = this.stats.highest_score;

        // Mettre à jour les scores des candidats existants
        if (response.candidates && response.candidates.length > 0) {
          console.log('DashboardComponent - mise à jour des scores des candidats');
          this.candidates = this.candidates.map(candidate => {
            const matchingCandidate = response.candidates.find(c => c._id === candidate._id);
            if (matchingCandidate) {
              return {
                ...candidate,
                percentage: matchingCandidate.percentage || candidate.percentage,
                test1_percentage: matchingCandidate.test1_percentage || candidate.test1_percentage,
                test2_percentage: matchingCandidate.test2_percentage || candidate.test2_percentage,
                final_test_percentage: matchingCandidate.final_test_percentage || candidate.final_test_percentage,
                test1_score: matchingCandidate.test1_score,
                test1_total: matchingCandidate.test1_total,
                test2_score: matchingCandidate.test2_score,
                test2_total: matchingCandidate.test2_total,
                final_test_score: matchingCandidate.final_test_score,
                final_test_total: matchingCandidate.final_test_total,
                test1: matchingCandidate.test1,
                test2: matchingCandidate.test2,
                final_test: matchingCandidate.final_test,
                final_test_seuil: this.acceptanceThreshold,
                // Ajouter la date du test final si disponible
                date: matchingCandidate.date || candidate.date
              };
            }
            return candidate;
          });
        }

        // CORRECTION PRINCIPALE: Recalculer correctement les candidats acceptés/refusés
        this.calculateCandidateStatuses();
        
        // Préparer les données des tests
        this.prepareTestScoresData();
        
        // Initialiser les graphiques
        setTimeout(() => {
          this.initializeCharts();
        }, 0);
      } else {
        console.error('DashboardComponent - échec du chargement des statistiques');
        this.error = 'Échec du chargement des statistiques';
        this.initializeCharts();
      }
    });
}

 
createCandidatesStatusChart(): void {
  if (!this.candidatesStatusChartRef) {
    console.warn('DashboardComponent - référence au canvas candidatesStatusChart non disponible');
    return;
  }
  
  // Destruction du graphique existant s'il y en a un
  if (this.candidatesStatusChart) {
    this.candidatesStatusChart.destroy();
  }
  
  // Recalculer les statuts avant de créer le graphique
  this.calculateCandidateStatuses();
  
  // Vérifier qu'il y a des candidats qui ont passé le test final
  const candidatesWithFinalTest = this.candidates.filter(c => 
    c.final_test_percentage !== undefined && 
    c.final_test_percentage !== null && 
    !isNaN(Number(c.final_test_percentage))
  );
  
  const acceptedCount = this.acceptedCandidatesCount;
  const rejectedCount = this.rejectedCandidatesCount;
  const notTestedCount = this.totalCandidates - candidatesWithFinalTest.length;
  
  console.log('DashboardComponent - Données du graphique:', {
    totalCandidates: this.totalCandidates,
    candidatesWithFinalTest: candidatesWithFinalTest.length,
    acceptedCount,
    rejectedCount,
    notTestedCount,
    threshold: this.acceptanceThreshold
  });
  
  // Création du nouveau graphique
  const ctx = this.candidatesStatusChartRef.nativeElement.getContext('2d');
  if (!ctx) return;
  
  // Toujours inclure toutes les catégories, même si elles sont à 0
  const data = [acceptedCount, rejectedCount, notTestedCount];
  const labels = ['Accepted', 'Not Accepted', 'Not Tested'];
  const backgroundColor = [
    'rgba(75, 192, 192, 0.6)',   // Vert pour acceptés
    'rgba(255, 99, 132, 0.6)',   // Rouge pour refusés
    'rgba(201, 203, 207, 0.6)'   // Gris pour non testés
  ];
  const borderColor = [
    'rgba(75, 192, 192, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(201, 203, 207, 1)'
  ];
  
  // Vérification : s'il n'y a aucun candidat, afficher un message
  if (this.totalCandidates === 0) {
    console.warn('DashboardComponent - Aucun candidat à afficher dans le graphique');
    // Vous pourriez ici afficher un message "Aucun candidat" dans le DOM
    return;
  }
  
  this.candidatesStatusChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Permet une meilleure adaptation à la taille du conteneur
      plugins: {
        title: {
          display: true,
          text: `Trainees Status (Threshold: ${this.acceptanceThreshold}%)`,
          color: '#333',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw as number;
              const total = (context.dataset.data as number[]).reduce((acc, data) => acc + Number(data), 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} candidates (${percentage}%)`;
            }
          }
        }
      },
      // Animation pour rendre le graphique plus fluide
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000
      }
    }
  });
  
  console.log('DashboardComponent - Graphique des statuts des candidats créé avec succès');
}

// Méthode calculateCandidateStatuses() améliorée
private calculateCandidateStatuses(): void {
  console.log('DashboardComponent - calcul des statuts des candidats avec seuil:', this.acceptanceThreshold);
  
  // Filtrer les candidats qui ont passé le test final
  const candidatesWithFinalTest = this.candidates.filter(c => {
    const hasValidScore = c.final_test_percentage !== undefined && 
                         c.final_test_percentage !== null && 
                         !isNaN(Number(c.final_test_percentage));
    
    if (hasValidScore) {
      console.log(`Candidat ${c.nom}: score final = ${c.final_test_percentage}%`);
    }
    
    return hasValidScore;
  });
  
  // Calculer les candidats acceptés avec le seuil dynamique
  const acceptedCandidates = candidatesWithFinalTest.filter(c => {
    const isAccepted = Number(c.final_test_percentage) >= this.acceptanceThreshold;
    console.log(`Candidat ${c.nom}: ${c.final_test_percentage}% >= ${this.acceptanceThreshold}% ? ${isAccepted ? 'ACCEPTÉ' : 'REFUSÉ'}`);
    return isAccepted;
  });
  
  // Mettre à jour les compteurs
  this.acceptedCandidatesCount = acceptedCandidates.length;
  this.rejectedCandidatesCount = candidatesWithFinalTest.length - this.acceptedCandidatesCount;
  
  // Mettre à jour les stats
  this.stats.accepted_candidates = acceptedCandidates;
  this.stats.accepted_candidates_count = this.acceptedCandidatesCount;
  
  console.log(`DashboardComponent - Résumé des statuts:
    - Total candidats: ${this.totalCandidates}
    - Candidats avec test final: ${candidatesWithFinalTest.length}
    - Candidats acceptés: ${this.acceptedCandidatesCount}
    - Candidats refusés: ${this.rejectedCandidatesCount}
    - Candidats non testés: ${this.totalCandidates - candidatesWithFinalTest.length}
    - Seuil d'acceptation: ${this.acceptanceThreshold}%`);
}
// 5. Ajouter des getters pour le template
get successRate(): number {
  const candidatesWithFinalTest = this.candidates.filter(c => 
    c.final_test_percentage !== undefined && 
    c.final_test_percentage !== null && 
    !isNaN(Number(c.final_test_percentage))
  );
  
  if (candidatesWithFinalTest.length === 0) {
    return 0;
  }
  
  return Math.round((this.acceptedCandidatesCount / candidatesWithFinalTest.length) * 100);
}

get candidatesWithFinalTestCount(): number {
  return this.candidates.filter(c => 
    c.final_test_percentage !== undefined && 
    c.final_test_percentage !== null && 
    !isNaN(Number(c.final_test_percentage))
  ).length;
}

// 6. Correction de la méthode recalculateCandidateStatuses
private recalculateCandidateStatuses(): void {
  console.log('DashboardComponent - recalcul des statuts des candidats avec le nouveau seuil');
  
  // Mettre à jour le seuil pour tous les candidats
  this.candidates.forEach(candidate => {
    candidate.final_test_seuil = this.acceptanceThreshold;
  });
  
  // Recalculer les statuts
  this.calculateCandidateStatuses();
  
  console.log(`DashboardComponent - après recalcul: ${this.acceptedCandidatesCount} acceptés, ${this.rejectedCandidatesCount} refusés`);
}

// 7. Amélioration du formatage de date
formatFinalTestDate(candidate: Candidate): string {
  // Essayer plusieurs sources pour la date
  let dateToFormat = candidate.date;
  
  if (!dateToFormat && candidate.final_test && typeof candidate.final_test === 'object') {
    dateToFormat = (candidate.final_test as any).date;
  }
  
  if (!dateToFormat && candidate.created_at) {
    dateToFormat = candidate.created_at;
  }
  
  if (!dateToFormat) {
    return 'Non spécifiée';
  }
  
  return this.formatDate(dateToFormat);
}
}