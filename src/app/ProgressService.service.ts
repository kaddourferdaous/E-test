// progress.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SupportProgress {
  support_id: string;
  model_name: string;
  filename: string;
  viewed: boolean;
  view_date?: string;
  view_duration?: number; // en secondes
  questions_answered: boolean;
  questions_score?: number;
  questions_total?: number;
  completion_date?: string;
}

export interface CandidateProgress {
  candidate_id: string;
  model_name: string;
  total_supports: number;
  viewed_supports: number;
  completed_supports: number;
  total_questions: number;
  answered_questions: number;
  average_score: number;
  total_time_spent: number; // en minutes
  completion_percentage: number;
  last_activity: string;
  supports_progress: SupportProgress[];
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private baseUrl = 'https://training-backend-1pda.onrender.com/dash/api';

  constructor(private http: HttpClient) {}

  // Enregistrer qu'un support a été visualisé
  markSupportAsViewed(candidateId: string, supportId: string, modelName: string, filename: string, duration?: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/progress/support/viewed`, {
      candidate_id: candidateId,
      support_id: supportId,
      model_name: modelName,
      filename: filename,
      view_duration: duration
    });
  }

  // Enregistrer les réponses aux questions d'un support
  saveQuestionResponses(candidateId: string, supportId: string, responses: any[], score: number, total: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/progress/support/questions`, {
      candidate_id: candidateId,
      support_id: supportId,
      responses: responses,
      score: score,
      total: total
    });
  }

  // Récupérer l'avancement d'un candidat pour un modèle spécifique
  getCandidateProgress(candidateId: string, modelName: string): Observable<CandidateProgress> {
    return this.http.get<CandidateProgress>(`${this.baseUrl}/progress/candidate/${candidateId}/model/${modelName}`);
  }

  // Récupérer l'avancement global d'un candidat
  getCandidateOverallProgress(candidateId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/progress/candidate/${candidateId}`);
  }

  // Vérifier si un support a été complété
  isSupportCompleted(candidateId: string, supportId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/progress/support/${supportId}/completed/${candidateId}`);
  }

  // Récupérer les statistiques d'avancement pour tous les candidats
  getAllCandidatesProgress(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/progress/all-candidates`);
  }
}