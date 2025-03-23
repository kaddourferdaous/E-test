import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-support-list',
  templateUrl: './support-list.component.html',
  styleUrls: ['./support-list.component.css']
})
export class SupportListComponent implements OnInit {
  allMetadata: any[] = [];
  groupedMetadata: Record<string, Record<string, any[]>> = {};
  expandedModel: string | null = null; // Modèle actuellement agrandi
  isExpanded = false;
  modelName: any;
  constructor(private http: HttpClient,private router:Router,private route:ActivatedRoute) {
    this.modelName = this.route.snapshot.paramMap.get('modelName')!;
  }

  ngOnInit(): void {
    this.fetchAllMetadata();
  }
  

  expandCard() {
    this.isExpanded = true;
  }

  closeCard() {
    this.isExpanded = false;
  }
  fetchAllMetadata() {
    this.http.get<any>('http://localhost:5000/supp/supports/metadata/all').subscribe(
      (response) => {
        if (response && response.metadata) {
          this.allMetadata = response.metadata;
          this.groupMetadataByDayAndModel();
        } else {
          console.error('Données mal formatées');
        }
      },
      (error) => {
        console.error('Erreur de récupération des métadonnées:', error);
      }
    );
  }

  groupMetadataByDayAndModel() {
    this.groupedMetadata = this.allMetadata.reduce((acc, support) => {
      const day = support.model_day || 0;
      const modelName = support.model_name;

      if (!acc[day]) {
        acc[day] = {};
      }

      if (!acc[day][modelName]) {
        acc[day][modelName] = [];
      }

      acc[day][modelName].push(support);
      return acc;
    }, {} as Record<string, Record<string, any[]>>);
  }

  // Méthode pour agrandir ou réduire un modèle
toggleModel(modelName: string): void {
  this.router.navigate(['/model-detail', modelName]);
}
viewSupport(support: any) {
  // Construire l'URL avec les paramètres filename et model_name
  const url = `http://localhost:5000/supp/supports/view?model_name=${encodeURIComponent(support.model_name)}&filename=${encodeURIComponent(support.filename)}`;

  // Ouvrir l'URL dans le même onglet
  window.location.href = url;
}

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }}