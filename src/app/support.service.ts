import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PowerPointMetadata, WordMetadata } from './file-metadata';

export interface VideoMetadata {
  filename: string;
  description: string;
  tags: string[];
  expectation: string;
  upload_date: string;
  type: 'video';
}

export interface PdfMetadata {
  filename: string;
  description: string;
  tags: string[];
  expectation: string;
  upload_date: string;
  type: 'pdf';
}

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private apiUrl = 'http://127.0.0.1:5000/supp/supports';

  constructor(private http: HttpClient) {}

  getFiles() {
    return this.http.get<{
      videos: VideoMetadata[],
      pdfs: PdfMetadata[],
      ppts: PowerPointMetadata[], // Ajoutez les fichiers PPT
      words: WordMetadata[] // Ajoutez les fichiers Word
    }>('http://127.0.0.1:5000/supp/supports/metadata');
  }
  

  getFileMetadata(filename: string): Observable<VideoMetadata | PdfMetadata> {
    return this.http.get<VideoMetadata | PdfMetadata>(`${this.apiUrl}/metadata/${filename}`);
  }
}
