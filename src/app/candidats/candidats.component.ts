import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-candidats',
  templateUrl: './candidats.component.html',
  styleUrls: ['./candidats.component.css']
})
export class CandidatsComponent implements OnInit, AfterViewInit {
  // Données des candidats
  candidats: any[] = [];
  filteredCandidats: any[] = [];
  
  // Contrôles et filtres
  searchText: string = '';
  selectedFilter: string = 'all';
  sortOption: string = 'name';
  showComparison: boolean = false;
  
  // Référence graphique
  comparisonChart: any = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    console.log("📦 Chargement des candidats...");
    this.http.get<any[]>('assets/candidates.json').subscribe({
      next: data => {
        console.log("✅ Données reçues :", data);
        this.candidats = data;
        this.filteredCandidats = [...this.candidats];
        this.sortCandidats(); // Tri initial
      },
      error: err => {
        console.error("❌ Erreur lors du chargement :", err);
      }
    });
  }

  ngAfterViewInit(): void {
    // Ce hook sera utilisé pour initialiser le graphique après le chargement de la vue
    setTimeout(() => {
      if (this.showComparison) {
        this.createComparisonChart();
      }
    }, 500);
  }

  // Transforme les informations personnelles en tableau de clé/valeur pour affichage
  getPersonalInfoEntries(candidat: any): {key: string, value: string}[] {
    return Object.entries(candidat.personalInfo).map(([key, value]: [string, any]) => {
      // Formatage du nom de la clé (ex: fullName -> Nom complet)
      const formattedKey = key.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      return { key: formattedKey, value: value };
    });
  }

  // Filtre les candidats en fonction de la recherche et des filtres
  filterCandidats(): void {
    this.filteredCandidats = this.candidats.filter(candidat => {
      // Filtrage par texte de recherche
      const searchMatch = !this.searchText || 
        candidat.personalInfo.fullName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        candidat.personalInfo.cityOfOrigin.toLowerCase().includes(this.searchText.toLowerCase());
      
      // Filtrage par sélection
      let filterMatch = true;
      if (this.selectedFilter === 'passed') {
        filterMatch = candidat.dexterityTest.finalStatus === 'Passed';
      } else if (this.selectedFilter === 'highscore') {
        const overallScore = this.calculateOverallScore(candidat);
        filterMatch = overallScore > 80;
      }
      
      return searchMatch && filterMatch;
    });
    
    // Appliquer le tri après filtrage
    this.sortCandidats();
    
    // Mettre à jour le graphique si visible
    if (this.showComparison) {
      this.updateComparisonChart();
    }
  }

  // Trie les candidats selon l'option sélectionnée
  sortCandidats(): void {
    this.filteredCandidats.sort((a, b) => {
      switch (this.sortOption) {
        case 'name':
          return a.personalInfo.fullName.localeCompare(b.personalInfo.fullName);
        case 'score':
          return this.calculateOverallScore(b) - this.calculateOverallScore(a);
        case 'city':
          return a.personalInfo.cityOfOrigin.localeCompare(b.personalInfo.cityOfOrigin);
        default:
          return 0;
      }
    });
  }

  // Calcule le score global d'un candidat
  calculateOverallScore(candidat: any): number {
    return candidat.dexterityTest.totalScore + 
           candidat.logicTest.totalScore + 
           candidat.memoryTest.totalScore;
  }

  // Affiche ou masque la section de comparaison
  toggleComparison(): void {
    this.showComparison = !this.showComparison;
    
    if (this.showComparison) {
      // Attendre le rendu du DOM
      setTimeout(() => {
        this.createComparisonChart();
      }, 100);
    }
  }

  // Crée le graphique de comparaison
  createComparisonChart(): void {
    if (this.comparisonChart) {
      this.comparisonChart.destroy();
    }
    
    const ctx = document.getElementById('comparisonChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const labels = this.filteredCandidats.map(c => c.personalInfo.fullName);
    const dexterityScores = this.filteredCandidats.map(c => c.dexterityTest.totalScore);
    const logicScores = this.filteredCandidats.map(c => c.logicTest.totalScore);
    const memoryScores = this.filteredCandidats.map(c => c.memoryTest.totalScore);
    
    this.comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Dextérité',
            data: dexterityScores,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Logique',
            data: logicScores,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'Mémoire',
            data: memoryScores,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Comparaison des scores par catégorie'
          },
          tooltip: {
            callbacks: {
              footer: (tooltipItems: { dataIndex: any; }[]) => {
                const index = tooltipItems[0].dataIndex;
                const candidat = this.filteredCandidats[index];
                return `Score total: ${this.calculateOverallScore(candidat)}/270`;
              }
            }
          }
        }
      }
    });
  }

  // Met à jour le graphique de comparaison
  updateComparisonChart(): void {
    if (this.comparisonChart) {
      const labels = this.filteredCandidats.map(c => c.personalInfo.fullName);
      const dexterityScores = this.filteredCandidats.map(c => c.dexterityTest.totalScore);
      const logicScores = this.filteredCandidats.map(c => c.logicTest.totalScore);
      const memoryScores = this.filteredCandidats.map(c => c.memoryTest.totalScore);
      
      this.comparisonChart.data.labels = labels;
      this.comparisonChart.data.datasets[0].data = dexterityScores;
      this.comparisonChart.data.datasets[1].data = logicScores;
      this.comparisonChart.data.datasets[2].data = memoryScores;
      this.comparisonChart.update();
    } else if (this.showComparison) {
      this.createComparisonChart();
    }
  }
}