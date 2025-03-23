import { ActivatedRoute } from '@angular/router';
import { SupportService } from '../support.service';
import { PdfMetadata, VideoMetadata, PowerPointMetadata, WordMetadata } from '../file-metadata';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-file-detail',
  template: `
    <div *ngIf="isLoading; else content">
      <p>Chargement des détails...</p>
    </div>

    <ng-template #content>
      <div *ngIf="file; else error">
        <h2>{{ file?.filename }}</h2>
        <p>{{ file?.description }}</p>
        <p><strong>Tags:</strong> {{ file?.tags?.join(', ') || 'Aucun tag disponible' }}</p>
        <p><strong>Attente:</strong> {{ file?.expectation || 'Aucune attente spécifiée' }}</p>
        <p><strong>Date de téléversement:</strong> {{ file?.upload_date }}</p>

        <!-- Affichage du contenu en fonction du type de fichier -->
        <ng-container *ngIf="file.type === 'video'">
          <video controls width="100%" [poster]="getVideoThumbnailUrl(file!.filename)">
            <source [src]="getVideoUrl(file!.filename)" type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
          <br />
          <a [href]="getVideoUrl(file!.filename)" target="_blank">Regarder la vidéo</a>
        </ng-container>

        <ng-container *ngIf="file.type === 'pdf'">
          <iframe [src]="getPdfUrl(file!.filename)" width="100%" height="500px"></iframe>
          <br />
          <a [href]="getPdfUrl(file!.filename)" target="_blank">Voir le PDF</a>
        </ng-container>
        <ng-container *ngIf="file.type === 'word'">
  <iframe [src]="getWordUrl(file.filename)" width="100%" height="600px"></iframe>
</ng-container>

<ng-container *ngIf="file.type === 'ppt'">
  <iframe [src]="getPptUrl(file.filename)" width="100%" height="600px"></iframe>
</ng-container>



      </div>
    </ng-template>

    <ng-template #error>
      <p>Une erreur s'est produite lors du chargement du fichier. Veuillez réessayer plus tard.</p>
    </ng-template>
  `,
  styles: [
    `
      video {
        max-width: 100%;
        height: auto;
        margin-top: 16px;
      }
      iframe {
        border: none;
        margin-top: 16px;
      }
      h2 {
        font-size: 24px;
        color: #333;
      }
      p {
        font-size: 16px;
        color: #555;
      }
      a {
        display: inline-block;
        margin-top: 8px;
        color: #007bff;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class VideoDetailComponent implements OnInit {
  file: VideoMetadata | PdfMetadata | PowerPointMetadata | WordMetadata | null = null;
  isLoading: boolean = true;

  constructor(private route: ActivatedRoute, private supportService: SupportService) {}

  ngOnInit(): void {
    const filename = this.route.snapshot.paramMap.get('filename');
    
    if (filename) {
      this.loadFileDetails(filename);
    } else {
      console.error('Le paramètre filename est manquant');
      this.isLoading = false; // Fin du chargement si filename est manquant
    }
  }

  loadFileDetails(filename: string): void {
    this.supportService.getFileMetadata(filename).subscribe(
      (data) => {
        this.file = data;
        this.isLoading = false;
      },
      (error) => {
        console.error('Erreur lors du chargement des détails du fichier:', error);
        this.isLoading = false; // Fin du chargement en cas d'erreur
      }
    );
  }

  getVideoUrl(filename: string): string {
    return `http://127.0.0.1:5000/supp/supports/video/${filename}`;
  }

  getPdfUrl(filename: string): string {
    return `http://127.0.0.1:5000/supp/supports/pdf/${filename}`;
  }

  getWordUrl(filename: string): string {
    return `http://127.0.0.1:5000/supp/supports/word/${filename}`;
  }

  getPptUrl(filename: string): string {
    return `http://127.0.0.1:5000/supp/supports/ppt/${filename}`;
  }

  getVideoThumbnailUrl(filename: string): string {
    return `http://127.0.0.1:5000/supp/supports/video/thumbnail/${filename}`;
  }
}
