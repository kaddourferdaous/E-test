import { Component, OnInit } from '@angular/core';
import { SupportService } from '../support.service';
import { PdfMetadata, VideoMetadata, PowerPointMetadata, WordMetadata } from '../file-metadata';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-file-list',
  template: `
    <div *ngIf="files.length > 0; else noFiles">
      <div *ngFor="let file of files" class="file-card">
        <h3>{{ file.filename }}</h3>
        <p>{{ file.description }}</p>
        <p><strong>Tags:</strong> {{ file.tags?.join(', ') }}</p>
        <p><strong>Date de téléversement:</strong> {{ file.upload_date }}</p>

        <!-- Affichage en fonction du type de fichier -->
        <ng-container *ngIf="file.type === 'video'">
          <a [href]="getVideoUrl(file.filename)" target="_blank">Regarder la vidéo</a>
        </ng-container>

        <ng-container *ngIf="file.type === 'pdf'">
          <a [href]="getSanitizedPdfUrl(file.filename)" target="_blank">Voir le PDF</a>
        </ng-container>

        <ng-container *ngIf="file.type === 'ppt'">
          <a [href]="getPptUrl(file.filename)" target="_blank">Voir la présentation PPT</a>
        </ng-container>

        <ng-container *ngIf="file.type === 'word'">
          <a [href]="getWordUrl(file.filename)" target="_blank">Voir le fichier Word</a>
        </ng-container>
      </div>
    </div>
    <ng-template #noFiles>
      <p>Aucun fichier disponible.</p>
    </ng-template>
  `,
  styles: [
    `
      .file-card {
        border: 1px solid #ccc;
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 8px;
      }
      h3 {
        margin-top: 0;
      }
    `,
  ],
})
export class VideoListComponent implements OnInit {
  files: (VideoMetadata | PdfMetadata | PowerPointMetadata | WordMetadata)[] = [];

  constructor(
    private supportService: SupportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.supportService.getFiles().subscribe(
      (data) => {
        const allFiles = [
          ...data.videos,
          ...data.pdfs,
          ...data.ppts,
          ...data.words,
        ];
        this.files = allFiles.map((file) => ({
          ...file,
          type: this.getFileType(file.filename),
        }));
      },
      (error) => {
        console.error('Erreur lors du chargement des fichiers:', error);
      }
    );
  }

  getFileType(filename: string): 'video' | 'pdf' | 'ppt' | 'word' {
    if (filename.endsWith('.mp4') || filename.endsWith('.avi')) {
      return 'video';
    } else if (filename.endsWith('.pdf')) {
      return 'pdf';
    } else if (filename.endsWith('.ppt') || filename.endsWith('.pptx')) {
      return 'ppt';
    } else if (filename.endsWith('.doc') || filename.endsWith('.docx')) {
      return 'word';
    }
    return 'pdf';  // Par défaut, peut-être considérer comme PDF si le type n'est pas trouvé
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

  getSanitizedPdfUrl(filename: string) {
    const url = this.getPdfUrl(filename);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
