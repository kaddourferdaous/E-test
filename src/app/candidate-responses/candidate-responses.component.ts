import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-candidate-responses',
  templateUrl: './candidate-responses.component.html',
  styleUrls: ['./candidate-responses.component.css']
})
export class CandidateResponsesComponent implements OnInit {
  // Paramètres
  candidateId: string = '';
  testType: string = 'final'; // Valeur par défaut
  
  // États
  loading: boolean = false;
  errorMessage: string = '';
  
  // Données
  candidateResponses: any[] = [];
  candidateInfo: any = null;
  
  // URL de l'API
  private apiUrl = 'https://training-backend-1pda.onrender.com';
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }
  
  ngOnInit(): void {
    // Récupérer les paramètres de l'URL si présents
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.candidateId = params['id'];
      }
      
      if (params['type']) {
        this.testType = params['type'];
        // Charger automatiquement les réponses si les paramètres sont présents
        this.loadCandidateResponses();
      }
    });
    
    // Alternative: récupérer les paramètres depuis des queryParams
    this.route.queryParams.subscribe(params => {
      const id = params['candidate_id'];
      const type = params['test_type'];
      
      if (id && !this.candidateId) {
        this.candidateId = id;
      }
      
      if (type && !this.testType) {
        this.testType = type;
      }
      
      // Charger les réponses si les deux paramètres sont disponibles
      if (this.candidateId && !this.loading) {
        this.loadCandidateInfo();
        this.loadCandidateResponses();
      }
    });
  }

  /**
   * Charge les informations du candidat
   */
  loadCandidateInfo(): void {
    this.http.get(`${this.apiUrl}/candidates/get_candidate`, {
      params: {
        candidate_id: this.candidateId
      }
    }).subscribe({
      next: (data) => {
        if (data) {
          this.candidateInfo = data;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des informations du candidat', error);
        // En cas d'échec, on essaiera d'extraire les infos des réponses plus tard
      }
    });
  }
  
  /**
   * Charge les réponses du candidat pour le type de test spécifié
   */
  loadCandidateResponses(): void {
    if (!this.candidateId) {
      this.errorMessage = 'L\'ID du candidat est requis.';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    // Adapter le type de test si nécessaire (pour "final" vs "test-final")
    const formattedTestType = this.testType === 'final' ? 'test-final' : `test-${this.testType}`;
    
    // Créer les paramètres de requête directement
    const params = new HttpParams()
      .set('candidate_id', this.candidateId)
      .set('test_type', formattedTestType);
    
    // Appel à l'API avec les paramètres dans l'URL comme demandé
    this.http.get(`${this.apiUrl}/answers/get_candidate_responses`, { params })
      .subscribe({
        next: (response: any) => {
          if (response && response.success) {
            this.candidateResponses = response.results || [];
            
            // Récupérer les informations du candidat à partir des réponses
            if (this.candidateResponses.length > 0 && !this.candidateInfo) {
              this.extractCandidateInfo();
            }
            
            // Si aucun résultat n'est trouvé, afficher un message
            if (this.candidateResponses.length === 0) {
              this.errorMessage = 'Aucune réponse trouvée pour ce candidat et ce type de test.';
            }
          } else {
            this.errorMessage = response.message || 'Une erreur est survenue lors de la récupération des réponses.';
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des réponses:', error);
          this.errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
          this.loading = false;
        }
      });
  }
  
  /**
   * Extrait les informations du candidat à partir des réponses
   */
  extractCandidateInfo(): void {
    const firstResponse = this.candidateResponses[0];
    
    if (!firstResponse) return;
    
    // Tenter d'extraire les informations du candidat à partir de la première réponse
    this.candidateInfo = {
      id: firstResponse.candidateId || 
          (firstResponse.candidate ? firstResponse.candidate.id : null) ||
          this.candidateId,
          
      email: firstResponse.candidateEmail || 
             (firstResponse.candidate ? firstResponse.candidate.email : null) || 
             firstResponse.email || 
             'Non disponible',
             
      name: (firstResponse.candidate ? 
             `${firstResponse.candidate.firstName || ''} ${firstResponse.candidate.lastName || ''}` : null) ||
             'Candidat'
    };
  }
  
  /**
   * Rafraîchit les données en appelant à nouveau l'API
   */
  refreshData(): void {
    this.loadCandidateResponses();
  }
  
  /**
   * Change le type de test et recharge les données
   */
  changeTestType(newType: string): void {
    this.testType = newType;
    this.loadCandidateResponses();
  }
  
  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateString: string | Date): string {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString.toString();
    }
  }
  
  /**
   * Vérifie si la réponse est un test final
   */
  isFinalTest(response: any): boolean {
    if (!response) return false;
    
    // Vérifie si c'est explicitement un test final
    if (response.test_type === 'final' || response.test_type === 'test-final') {
      return true;
    }
    
    // Vérifie les caractéristiques d'un test final
    return (response.submissions && Array.isArray(response.submissions)) ||
           (response.results && response.results.score !== undefined);
  }
  
  /**
   * Calcule le score moyen pour les tests finaux
   */
  getAverageScore(): number | null {
    const finalTests = this.candidateResponses.filter(r => this.isFinalTest(r));
    if (finalTests.length === 0) return null;
    
    let totalScore = 0;
    let totalMaxScore = 0;
    
    finalTests.forEach(response => {
      if (response.score !== undefined && response.total !== undefined) {
        totalScore += parseFloat(response.score) || 0;
        totalMaxScore += parseFloat(response.total) || 0;
      } else if (response.percentage !== undefined) {
        // Si le pourcentage est directement disponible
        return response.percentage;
      }
    });
    
    return totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : null;
  }

  /**
   * Récupère le score total pour tous les tests finaux
   */
  getTotalScore(): number {
    return this.candidateResponses
      .filter(r => this.isFinalTest(r))
      .reduce((sum, test) => sum + (parseFloat(test.score) || 0), 0);
  }

  /**
   * Récupère le total possible pour tous les tests finaux
   */
  getTotalPossible(): number {
    return this.candidateResponses
      .filter(r => this.isFinalTest(r))
      .reduce((sum, test) => sum + (parseFloat(test.total) || 0), 0);
  }

  /**
   * Récupère le nombre de tests finaux complétés
   */
  getCompletedTests(): number {
    return this.candidateResponses.filter(r => this.isFinalTest(r)).length;
  }

  /**
   * Vérifie s'il y a des réponses disponibles
   */
  hasResponses(): boolean {
    return this.candidateResponses.length > 0;
  }

  /**
   * Récupère les réponses filtrées par type de test
   */
  getFilteredResponses(): any[] {
    if (this.testType === 'final') {
      return this.candidateResponses.filter(r => this.isFinalTest(r));
    } else {
      const testType = `test-${this.testType}`;
      return this.candidateResponses.filter(r => 
        r.test_type === this.testType || r.test_type === testType
      );
    }
  }

  /**
   * Détermine la classe CSS à appliquer en fonction du score
   */
  getScoreClass(score: number | null): string {
    if (score === null) return 'neutral';
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  }

  /**
   * Récupère le libellé du type de test
   */
  getTestTypeLabel(response: any): string {
    if (this.isFinalTest(response)) {
      return 'Test Final';
    }
    
    switch (response.test_type) {
      case 'jour1': case 'test-jour1': return 'Test Jour 1';
      case 'jour2': case 'test-jour2': return 'Test Jour 2';
      default: return 'Test';
    }
  }

  /**
   * Détermine la classe CSS à appliquer pour une soumission
   */
  getSubmissionClass(submission: any): string {
    if (!submission || submission.score === undefined || submission.maxScore === undefined) {
      return 'neutral';
    }
    
    const percentage = (submission.score / submission.maxScore) * 100;
    return this.getScoreClass(percentage);
  }

  /**
   * Affiche un libellé formaté pour le type de question
   */
  getQuestionTypeDisplay(type: string): string {
    switch (type) {
      case 'QCM': return 'QCM';
      case 'ordonner': return 'Ordonner';
      case 'appariement': return 'Appariement';
      case 'ESPACES_VIDES': return 'Espaces Vides';
      case 'MULTI_VRAI_FAUX': return 'Multi Vrai/Faux';
      case 'VRAI_FAUX': return 'Vrai/Faux';
      case 'libre': return 'Question Libre';
      default: return type || 'Non défini';
    }
  }

  /**
   * Formate les indices pour l'affichage (ajoute +1)
   */
  formatIndices(indices: number[]): string {
    if (!indices || !Array.isArray(indices)) return 'Non disponible';
    return indices.map(i => (i + 1)).join(', ');
  }

  /**
   * Récupère les éléments à ordonner dans un format standardisé
   */
  getOrderItems(answers: any): {key: string, value: any}[] {
    if (!answers) return [];
    
    // Si c'est un tableau d'objets avec des propriétés key et value
    if (Array.isArray(answers) && answers.length > 0 && answers[0].key !== undefined) {
      return answers;
    }
    
    // Si c'est un objet avec des paires clé-valeur
    if (typeof answers === 'object' && !Array.isArray(answers)) {
      return Object.entries(answers).map(([key, value]) => ({ key, value }));
    }
    
    return [];
  }

  /**
   * Récupère les éléments d'espaces vides dans un format standardisé
   */
  getBlankItems(answers: any): {key: string, value: any}[] {
    return this.getOrderItems(answers); // Utilise la même logique que getOrderItems
  }

  /**
   * Vérifie si une réponse contient des détails de questions
   */
  hasQuestionDetails(response: any): boolean {
    if (!response) return false;
    
    if (this.isFinalTest(response) && response.submissions && response.submissions.length > 0) {
      return true;
    }
    
    if (response.questions && Array.isArray(response.questions) && response.questions.length > 0) {
      return true;
    }
    
    return false;
  }

  /**
   * Récupère les détails des questions d'une réponse
   */
  getQuestionDetails(response: any): any[] {
    if (!response) return [];
    
    if (response.questions && Array.isArray(response.questions)) {
      return response.questions;
    }
    
    if (response.submissions && Array.isArray(response.submissions)) {
      return response.submissions;
    }
    
    return [];
  }

  /**
   * Formate les réponses pour l'affichage
   */
  formatAnswers(answers: any): string {
    if (!answers) return 'Aucune réponse';
    
    try {
      if (typeof answers === 'string') {
        return answers;
      }
      
      // Formater les réponses comme JSON indenté
      return JSON.stringify(answers, null, 2);
    } catch (e) {
      console.error('Erreur lors du formatage des réponses', e);
      return 'Erreur de formatage';
    }
  }
}