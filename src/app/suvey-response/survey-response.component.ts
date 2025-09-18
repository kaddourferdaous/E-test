// survey-dashboard.component.ts

import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

interface SurveyResponse {
  _id: string;
  trainee_id: string;
  session_id: string;
  responses: any[];
  timestamp: string;
  formatted_date: string;
  date_info: any;
  survey_type: string; // 'ojt', 'pratique', 'theorique'
}

@Component({
  selector: 'app-survey-dashboard',
  templateUrl: './survey-response.component.html',
  styleUrls: ['./survey-response.component.css']
})
export class SurveyResponseComponent implements OnInit, AfterViewInit {
  allSurveys: SurveyResponse[] = [];
  filteredSurveys: SurveyResponse[] = [];
  selectedSurvey: SurveyResponse | null = null;
  loading = true;
  surveyTypeChart!: Chart;
  satisfactionChart!: Chart;
  satisfactionTrendChart!: Chart;
  selectedSurveyChart!: Chart;
  satisfactionByCategoryChart!: Chart; // Nouveau graphique
  
  filterOptions = {
    type: 'all', // 'all', 'ojt', 'pratique', 'theorique'
    traineeId: '',
    sessionId: '',
    dateFrom: '',
    dateTo: ''
  };
  
  @ViewChild('surveyTypeChart') surveyTypeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('satisfactionChart') satisfactionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('satisfactionTrendChart') satisfactionTrendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('selectedSurveyChart') selectedSurveyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('satisfactionByCategoryChart') satisfactionByCategoryChartRef!: ElementRef<HTMLCanvasElement>; // Nouveau ViewChild
  
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadAllSurveys();
  }

  ngAfterViewInit() {
    // Charts will be initialized after data is loaded
    setTimeout(() => {
      if (this.filteredSurveys.length > 0) {
        this.initializeCharts();
      }
    }, 500);
  }

  loadAllSurveys(): void {
    this.loading = true;
    
    // Charger chaque type de sondage
    forkJoin({
      theorique: this.http.get<any>('https://training-backend-1pda.onrender.com/eval/trainee/theorique/surveys'),
      pratique: this.http.get<any>('https://training-backend-1pda.onrender.com/eval/trainee/pratique/surveys'),
      ojt: this.http.get<any>('https://training-backend-1pda.onrender.com/eval/trainee/ojt/surveys')
    }).subscribe({
      next: (results) => {
        console.log('Résultats API théorique:', results.theorique); // Debug
        console.log('Résultats API pratique:', results.pratique); // Debug
        console.log('Résultats API ojt:', results.ojt); // Debug
        
        // Assurer que tous les types de sondages ont le même format
        this.allSurveys = [
          ...this.processSurveys(results.theorique.surveys || [], 'theorique'),
          ...this.processSurveys(results.pratique.surveys || [], 'pratique'),
          ...this.processSurveys(results.ojt.surveys || [], 'ojt')
        ];
        
        console.log('Sondages après traitement:', this.allSurveys); // Debug
        
        // Trier par date (le plus récent en premier)
        this.allSurveys.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        this.applyFilters();
        this.loading = false;
        
        // Initialize charts after data is loaded
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des sondages', error);
        this.loading = false;
      }
    });
  }

  // Fonction pour normaliser le format des données entre les différents types de sondages
  processSurveys(surveys: any[], surveyType: string): SurveyResponse[] {
    return surveys.map(survey => {
      return {
        ...survey,
        survey_type: surveyType,
        // Assurer que les réponses ont toujours la structure attendue
        responses: Array.isArray(survey.responses) ? survey.responses.map((response: any) => {
          // Pour le type théorique, vérifier si les commentaires sont dans un format différent
          let comment = response.comment;
          
          // Si le type est théorique et que comment n'existe pas, chercher ailleurs
          if (surveyType === 'theorique' && !comment) {
            // Vérifier les autres emplacements possibles du commentaire
            if (response.comments) {
              comment = response.comments;
            } else if (response.feedback) {
              comment = response.feedback;
            } else if (typeof response.data === 'object' && response.data !== null) {
              // Chercher dans un objet data potentiel
              comment = response.data.comment || response.data.comments || response.data.feedback || '';
            }
          }
          
          return {
            ...response,
            // Si question_details est manquant, initialiser avec un objet vide
            question_details: response.question_details || {},
            // Normaliser l'emplacement du commentaire
            comment: comment || ''
          };
        }) : []
      };
    });
  }

  applyFilters(): void {
    this.filteredSurveys = this.allSurveys.filter(survey => {
      // Filtre par type de sondage
      if (this.filterOptions.type !== 'all' && survey.survey_type !== this.filterOptions.type) {
        return false;
      }
      
      // Filtre par ID de stagiaire
      if (this.filterOptions.traineeId && !survey.trainee_id.includes(this.filterOptions.traineeId)) {
        return false;
      }
      
      // Filtre par ID de session
      if (this.filterOptions.sessionId && !survey.session_id.includes(this.filterOptions.sessionId)) {
        return false;
      }
      
      // Filtre par date (de)
      if (this.filterOptions.dateFrom) {
        const surveyDate = new Date(survey.timestamp);
        const fromDate = new Date(this.filterOptions.dateFrom);
        if (surveyDate < fromDate) {
          return false;
        }
      }
      
      // Filtre par date (à)
      if (this.filterOptions.dateTo) {
        const surveyDate = new Date(survey.timestamp);
        const toDate = new Date(this.filterOptions.dateTo);
        // Ajouter un jour pour inclure la date de fin
        toDate.setDate(toDate.getDate() + 1);
        if (surveyDate >= toDate) {
          return false;
        }
      }
      
      return true;
    });
    
    // Update charts after filters are applied
    if (!this.loading) {
      this.updateCharts();
    }
  }

  viewSurveyDetails(survey: SurveyResponse): void {
    this.selectedSurvey = survey;
    
    // After selecting a survey, initialize or update the selected survey chart
    setTimeout(() => {
      this.initializeSelectedSurveyChart();
    }, 100);
  }

  resetFilters(): void {
    this.filterOptions = {
      type: 'all',
      traineeId: '',
      sessionId: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  getSurveyTypeLabel(type: string): string {
    switch (type) {
      case 'ojt': return 'On-the-Job Training';
      case 'pratique': return 'Practical Training';
      case 'theorique': return 'Theoretical Training';
      default: return 'Type Inconnu';
    }
  }

  getRatingLabel(rating: string): string {
    switch (rating) {
      case 'very_satisfied': return ' very satisfied';
      case 'satisfied': return 'satisfied';
      case 'not_satisfied': return 'Non satisfait';
      default: return rating || 'not satisfied';
    }
  }

  getRatingClass(rating: string): string {
    switch (rating) {
      case 'very_satisfied': return 'rating-very-satisfied';
      case 'satisfied': return 'rating-satisfied';
      case 'not_satisfied': return 'rating-not-satisfied';
      default: return '';
    }
  }
  
  // Initialize all charts
  initializeCharts(): void {
    if (this.filteredSurveys.length === 0) return;
    
    this.initializeSurveyTypeChart();
    this.initializeSatisfactionChart();
    this.initializeSatisfactionTrendChart();
    this.initializeSatisfactionByCategoryChart(); // Nouveau graphique
  }
  
  // Update all charts when filters change
  updateCharts(): void {
    if (this.surveyTypeChart) {
      this.surveyTypeChart.destroy();
    }
    if (this.satisfactionChart) {
      this.satisfactionChart.destroy();
    }
    if (this.satisfactionTrendChart) {
      this.satisfactionTrendChart.destroy();
    }
    if (this.satisfactionByCategoryChart) {
      this.satisfactionByCategoryChart.destroy();
    }
    
    this.initializeCharts();
  }
  
  // Chart 1: Survey Type distribution
  initializeSurveyTypeChart(): void {
    if (!this.surveyTypeChartRef) return;
    
    const canvas = this.surveyTypeChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Count surveys by type
    const surveyTypes = this.filteredSurveys.reduce((acc, survey) => {
      acc[survey.survey_type] = (acc[survey.survey_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Prepare data for chart
    const labels = Object.keys(surveyTypes).map(type => this.getSurveyTypeLabel(type));
    const data = Object.values(surveyTypes);
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',  // Red for OJT
      'rgba(54, 162, 235, 0.7)',  // Blue for Pratique
      'rgba(255, 206, 86, 0.7)'   // Yellow for Theorique
    ];
    
    this.surveyTypeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Types of training distribution',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  // Chart 2: Overall Satisfaction
  initializeSatisfactionChart(): void {
    if (!this.satisfactionChartRef) return;
    
    const canvas = this.satisfactionChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Count responses by satisfaction rating
    const ratings: Record<string, number> = {
      'very_satisfied': 0,
      'satisfied': 0,
      'not_satisfied': 0
    };
    
    // Collect all responses from all surveys
    this.filteredSurveys.forEach(survey => {
      survey.responses.forEach(response => {
        if (response.rating && response.rating in ratings) {
          ratings[response.rating as keyof typeof ratings]++;
        }
      });
    });
    
    // Prepare data for chart
    const labels = Object.keys(ratings).map(rating => this.getRatingLabel(rating));
    const data = Object.values(ratings);
    const backgroundColors = [
      'rgba(75, 192, 192, 0.7)',  // Green for Very Satisfied
      'rgba(54, 162, 235, 0.7)',  // Blue for Satisfied
      'rgba(255, 99, 132, 0.7)'   // Red for Not Satisfied
    ];
    
    this.satisfactionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Responses Number',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Responses Number'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Level of Satisfaction'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Satifaction Level repartition',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  // Chart 3: Satisfaction trend over time
  initializeSatisfactionTrendChart(): void {
    if (!this.satisfactionTrendChartRef) return;
    
    const canvas = this.satisfactionTrendChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Group surveys by month
    const surveysByMonth: Record<string, any[]> = {};
    
    // Sort surveys by date first
    const sortedSurveys = [...this.filteredSurveys].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Group by month
    sortedSurveys.forEach(survey => {
      const date = new Date(survey.timestamp);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!surveysByMonth[monthYear]) {
        surveysByMonth[monthYear] = [];
      }
      
      surveysByMonth[monthYear].push(survey);
    });
    
    // Calculate satisfaction scores by month
    const labels = Object.keys(surveysByMonth);
    const satisfactionByMonth = labels.map(month => {
      const surveys = surveysByMonth[month];
      
      // Count ratings for this month
      let verySatisfied = 0;
      let satisfied = 0;
      let notSatisfied = 0;
      let totalResponses = 0;
      
      surveys.forEach(survey => {
        survey.responses.forEach((response: { rating: string; }) => {
          totalResponses++;
          if (response.rating === 'very_satisfied') verySatisfied++;
          else if (response.rating === 'satisfied') satisfied++;
          else if (response.rating === 'not_satisfied') notSatisfied++;
        });
      });
      
      // Calculate percentages if there are responses
      return totalResponses > 0 ? {
        verySatisfied: (verySatisfied / totalResponses) * 100,
        satisfied: (satisfied / totalResponses) * 100,
        notSatisfied: (notSatisfied / totalResponses) * 100
      } : {
        verySatisfied: 0,
        satisfied: 0,
        notSatisfied: 0
      };
    });
    
    // Prepare datasets
    const datasets = [
      {
        label: 'Very Satisfied',
        data: satisfactionByMonth.map(item => item.verySatisfied),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.3
      },
      {
        label: 'Satisfied',
        data: satisfactionByMonth.map(item => item.satisfied),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.3
      },
      {
        label: 'Not Satisfied',
        data: satisfactionByMonth.map(item => item.notSatisfied),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.3
      }
    ];
    
    this.satisfactionTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percent (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Evolution of satisfaction over time',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }

  // Nouveau Chart 5: Satisfaction by Title (séparé par type de survey)
  initializeSatisfactionByCategoryChart(): void {
    if (!this.satisfactionByCategoryChartRef) return;
    
    const canvas = this.satisfactionByCategoryChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Collecter toutes les réponses par titre et type de survey
    const responsesByTitleAndType: Record<string, Record<string, { 
      very_satisfied: number, 
      satisfied: number, 
      not_satisfied: number, 
      total: number 
    }>> = {
      'theorique': {},
      'pratique': {},
      'ojt': {}
    };
    
    // Parcourir tous les sondages filtrés
    this.filteredSurveys.forEach(survey => {
      survey.responses.forEach(response => {
        const title = response.question_details?.title || 'Untitled';
        const surveyType = survey.survey_type;
        
        if (!responsesByTitleAndType[surveyType][title]) {
          responsesByTitleAndType[surveyType][title] = {
            very_satisfied: 0,
            satisfied: 0,
            not_satisfied: 0,
            total: 0
          };
        }
        
        responsesByTitleAndType[surveyType][title].total++;
        
        if (response.rating === 'very_satisfied') {
          responsesByTitleAndType[surveyType][title].very_satisfied++;
        } else if (response.rating === 'satisfied') {
          responsesByTitleAndType[surveyType][title].satisfied++;
        } else if (response.rating === 'not_satisfied') {
          responsesByTitleAndType[surveyType][title].not_satisfied++;
        }
      });
    });
    
    // Créer les labels avec préfixe du type de survey
    const allLabels: string[] = [];
    const datasets: any[] = [
      {
        label: 'Very Satisfied',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Satisfied',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Not Satisfied',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ];
    
    // Organiser les données par type de survey
    ['theorique', 'pratique', 'ojt'].forEach(surveyType => {
      const typeLabel = this.getSurveyTypeLabel(surveyType);
      const titles = Object.keys(responsesByTitleAndType[surveyType]);
      
      titles.forEach(title => {
        const labelWithType = `${typeLabel}: ${title}`;
        allLabels.push(labelWithType);
        
        const data = responsesByTitleAndType[surveyType][title];
        datasets[0].data.push(data.very_satisfied);
        datasets[1].data.push(data.satisfied);
        datasets[2].data.push(data.not_satisfied);
      });
    });
    
    this.satisfactionByCategoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: allLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
            title: {
              display: true,
              text: 'Number of Responses'
            }
          },
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Question Titles by Survey Type'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Satisfaction Levels by Question Title (Separated by Survey Type)',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  // Chart 4: Selected Survey Detail Chart
  initializeSelectedSurveyChart(): void {
    if (!this.selectedSurveyChartRef || !this.selectedSurvey) return;
    
    const canvas = this.selectedSurveyChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (this.selectedSurveyChart) {
      this.selectedSurveyChart.destroy();
    }
    
    // Group questions by category
    const responsesByCategory: Record<string, { 
      veryGood: number, 
      good: number, 
      bad: number, 
      total: number 
    }> = {};
    
    this.selectedSurvey.responses.forEach(response => {
      const category = response.question_details?.category || 'Uncategorized';
      
      if (!responsesByCategory[category]) {
        responsesByCategory[category] = {
          veryGood: 0,
          good: 0,
          bad: 0,
          total: 0
        };
      }
      
      responsesByCategory[category].total++;
      
      if (response.rating === 'very_satisfied') {
        responsesByCategory[category].veryGood++;
      } else if (response.rating === 'satisfied') {
        responsesByCategory[category].good++;
      } else if (response.rating === 'not_satisfied') {
        responsesByCategory[category].bad++;
      }
    });
    
    // Prepare data for chart
    const categories = Object.keys(responsesByCategory);
    const veryGoodData = categories.map(cat => responsesByCategory[cat].veryGood);
    const goodData = categories.map(cat => responsesByCategory[cat].good);
    const badData = categories.map(cat => responsesByCategory[cat].bad);
    
    this.selectedSurveyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Très satisfait',
            data: veryGoodData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Satisfait',
            data: goodData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Non satisfait',
            data: badData,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
            title: {
              display: true,
              text: 'Responses Number'
            }
          },
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Categories'
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Réponses par catégorie',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
}