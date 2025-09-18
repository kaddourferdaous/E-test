import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface Question {
  _id: string;
  type: string;
  question: string;
  options?: string[];
  reponse_correcte: string[];
  note: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://training-backend-1pda.onrender.com';
  isAuthenticated: boolean = false;

  constructor(private http: HttpClient) {}



  signup(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/candidate/signup`, data).pipe(
      catchError((error) => {
        console.error('Erreur lors de l\'inscription:', error);
        throw error;
      })
    );
  }

  getCandidates(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/candidates`).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération des candidats:', error);
        throw error;
      })
    );
  }

  loginTraineeById(id: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/auth/trainee/login-by-id`, { id }).pipe(
    tap((response) => {
      console.log('Réponse du serveur stagiaire:', JSON.stringify(response, null, 2));
      if (response && response.id) { // Adjust to response.candidateId if needed
        const candidateInfo = {
          id: response.id, // Adjust to response.candidateId if needed
          matricule: response.matricule || 'N/A',
          nom: response.nom,
          prenom: response.prenom,
          email: response.email || ''
        };
        localStorage.setItem('candidateId', response.id.toString());
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('candidateInfo', JSON.stringify(candidateInfo));
        this.isAuthenticated = true;
        console.log('Informations stagiaire stockées:', candidateInfo);
      } else {
        console.error('Structure de réponse inattendue, id manquant:', response);
        throw new Error('ID du candidat non reçu dans la réponse du serveur');
      }
    }),
    catchError((error) => {
      console.error('Erreur lors de la connexion stagiaire:', error);
      if (error.error?.debug) {
        console.log('Informations de débogage:', error.error.debug);
      }
      throw error;
    })
  );
}
  createTrainer(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/trainer/signup`, data).pipe(
      catchError((error) => {
        console.error('Erreur lors de l\'inscription du formateur:', error);
        throw error;
      })
    );
  }




  // Méthodes utilitaires pour la gestion des tokens
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  getTrainerInfo(trainerId: string): Observable<any> {
    console.log('Sending getTrainerInfo request:', { url: `${this.apiUrl}/auth/trainer/${trainerId}` });
    return this.http.get(`${this.apiUrl}/auth/trainer/${trainerId}`).pipe(
      tap((response: any) => {
        console.log('getTrainerInfo response:', JSON.stringify(response, null, 2));
        localStorage.setItem('trainer', JSON.stringify(response));
      }),
      catchError((error) => {
        console.error('Erreur lors de getTrainerInfo:', error);
        throw error;
      })
    );
  }

  requestEmail2fa(trainerId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/trainer/request-email-2fa`, { trainer_id: trainerId }).pipe(
      tap((response) => {
        console.log('Réponse demande email 2FA:', response);
      }),
      catchError((error) => {
        console.error('Erreur lors de la demande email 2FA:', error);
        throw error;
      })
    );
  }

  getTrainerId(): string | null {
    return localStorage.getItem('trainerId');
  }

  getCandidatsByTrainerId(): Observable<any> {
    const trainerId = this.getTrainerId();
    return this.http.get<any>(`${this.apiUrl}/candidat/get_candidats_by_trainer/${trainerId}`);
  }

  private generateTempToken(id: string): string {
    return `temp-token-${id}-${Date.now()}`;
  }

  checkTrainerAuthentication(): boolean {
    const token = localStorage.getItem('trainerToken');
    const trainerId = localStorage.getItem('trainerId');
    console.log('Vérification auth - Token:', token);
    console.log('Vérification auth - TrainerID:', trainerId);
    return !!token && !!trainerId;
  }

  printTrainerSessionInfo(): void {
    console.group('[AuthService] Informations du formateur connecté');
    console.log('Token:', localStorage.getItem('trainerToken'));
    console.log('ID:', localStorage.getItem('trainerId'));
    const trainerInfo = localStorage.getItem('trainerInfo');
    if (trainerInfo) {
      console.log('Détails du formateur:', JSON.parse(trainerInfo));
    } else {
      console.warn('Aucune information de formateur trouvée');
    }
    console.groupEnd();
  }

  logoutTrainer(): void {
    localStorage.removeItem('trainerToken');
    localStorage.removeItem('trainerId');
    localStorage.removeItem('trainerInfo');
    localStorage.removeItem('trainerEmail');
    localStorage.removeItem('hasTotp');
    this.isAuthenticated = false;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('candidateId');
    localStorage.removeItem('candidateInfo');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('candidateId');
    sessionStorage.removeItem('candidateInfo');
    this.isAuthenticated = false;
  }

  getAuthToken(): string | null {
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      return localToken;
    }
    return sessionStorage.getItem('authToken');
  }

  checkAuthentication(): boolean {
    const token = this.getAuthToken();
    this.isAuthenticated = !!token;
    return this.isAuthenticated;
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/supports/categories`).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération des catégories de supports:', error);
        throw error;
      })
    );
  }

  uploadSupport(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/supports/video/metadata`, payload).pipe(
      catchError((error) => {
        console.error('Erreur lors de l\'upload du support:', error);
        throw error;
      })
    );
  }

  getSupports(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/supports/metadata/all`, {
      headers: { Authorization: `Bearer ${this.getAuthToken()}` }
    }).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération des supports:', error);
        throw error;
      })
    );
  }

  getQuestions(language: string, day?: string): Observable<any> {
    let url = `${this.apiUrl}/api/questions?langue=${language}`;
    if (day) {
      url += `&model_day=${day}`;
    }
    console.log('Requesting questions from URL:', url);
    return this.http.get<any>(url);
  }

  saveResponses(responses: any): Observable<any> {
    const url = `${this.apiUrl}/api/save-responses`;
    return this.http.post(url, responses);
  }

  private storeCandidateInfo(candidateId: string, token: string, candidate: any): void {
    console.log('Storing candidate info:', candidate);
    localStorage.setItem('candidateId', candidateId);
    localStorage.setItem('authToken', token);
    if (candidate.nom && candidate.email) {
      localStorage.setItem('candidateInfo', JSON.stringify({
        id: candidateId,
        nom: candidate.nom,
        email: candidate.email,
      }));
    } else {
      console.error('Nom ou email manquant dans les données du candidat');
    }
  }

  getCandidateInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/candidates`);
  }

  getCandidateById(candidateId: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.apiUrl}/auth/candidate/${candidateId}`);
  }

 getCandidateId(): string | null {
  return localStorage.getItem('candidateId');
}

 
  getTraineeId(): string | null {
    return localStorage.getItem('traineeId');
  }

  getTraineeInfo(): any {
    const traineeInfo = localStorage.getItem('traineeInfo');
    return traineeInfo ? JSON.parse(traineeInfo) : null;
  }

  checkTraineeAuthentication(): boolean {
    const token = localStorage.getItem('authToken');
    const traineeId = localStorage.getItem('traineeId');
    console.log('Vérification auth stagiaire - Token:', !!token, 'ID:', !!traineeId);
    return !!token && !!traineeId;
  }

  logoutTrainee(): void {
    localStorage.removeItem('traineeId');
    localStorage.removeItem('traineeInfo');
    localStorage.removeItem('authToken');
    this.isAuthenticated = false;
    console.log('Stagiaire déconnecté');
  }
  // Ajoutez ces méthodes à votre AuthService existant

// Méthode mise à jour pour la vérification 2FA lors de la connexion
verify2fa(matricule: string, code: string, method: string = 'totp'): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  const body = { 
    totp_code: code, 
    method: method,
    is_login: true  // Indiquer que c'est pour la connexion
  };
  
  console.log('Sending verify2fa request (login):', { url: `${this.apiUrl}/auth/2fa/verify/${matricule}`, body });
  return this.http.post(`${this.apiUrl}/auth/2fa/verify/${matricule}`, body, { headers }).pipe(
    tap((response: any) => {
      console.log('verify2fa response (login):', JSON.stringify(response, null, 2));
    }),
    catchError((error) => {
      console.error('Erreur lors de verify2fa (login):', error);
      throw error;
    })
  );
}


// Méthode mise à jour pour le setup
setupTotp(matricule: string): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  console.log('Sending setupTotp request:', { url: `${this.apiUrl}/auth/2fa/setup/${matricule}` });
  return this.http.post(`${this.apiUrl}/auth/2fa/setup/${matricule}`, {}, { headers }).pipe(
    tap((response: any) => {
      console.log('setupTotp response:', JSON.stringify(response, null, 2));
      
      // Stocker temporairement les données de setup
      if (response.success && response.data) {
        localStorage.setItem('tempSetupData', JSON.stringify({
          secret_key: response.data.secret_key,
          trainer_id: response.data.trainer_id
        }));
      }
    }),
    catchError((error) => {
      console.error('Erreur lors de setupTotp:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });
      throw error;
    })
  );
}

// Nouvelle méthode pour récupérer le statut 2FA
get2faStatus(matricule: string): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  console.log('Sending get2faStatus request:', { url: `${this.apiUrl}/auth/2fa/status/${matricule}` });
  return this.http.get(`${this.apiUrl}/auth/2fa/status/${matricule}`, { headers }).pipe(
    tap((response: any) => {
      console.log('get2faStatus response:', JSON.stringify(response, null, 2));
    }),
    catchError((error) => {
      console.error('Erreur lors de get2faStatus:', error);
      throw error;
    })
  );
}

// Nouvelle méthode pour désactiver la 2FA
disable2fa(matricule: string, totpCode: string): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  const body = { totp_code: totpCode };
  
  console.log('Sending disable2fa request:', { url: `${this.apiUrl}/auth/2fa/disable/${matricule}`, body });
  return this.http.post(`${this.apiUrl}/auth/2fa/disable/${matricule}`, body, { headers }).pipe(
    tap((response: any) => {
      console.log('disable2fa response:', JSON.stringify(response, null, 2));
    }),
    catchError((error) => {
      console.error('Erreur lors de disable2fa:', error);
      throw error;
    })
  );
}

// Méthode mise à jour pour le login formateur
loginTrainer(credentials: { matricule: string; role: string }): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  console.log('Sending loginTrainer request:', { url: `${this.apiUrl}/auth/trainer/login`, credentials });
  return this.http.post(`${this.apiUrl}/auth/trainer/login`, credentials, { headers }).pipe(
    tap((response: any) => {
      console.log('loginTrainer response:', JSON.stringify(response, null, 2));
      
      if (response.requires_2fa) {
        // 2FA requise - ne pas définir comme authentifié
        console.log('2FA requise pour le formateur:', response.matricule);
        localStorage.setItem('pendingTrainer', JSON.stringify(response));
      } else if (response.id) {
        // Connexion réussie sans 2FA
        localStorage.setItem('trainer', JSON.stringify(response));
        localStorage.setItem('trainerId', response.id.toString());
        localStorage.setItem('trainerToken', response.token || 'temp-token');
        this.isAuthenticated = true;
        console.log('Connexion formateur réussie sans 2FA');
      }
    }),
    catchError((error) => {
      console.error('Erreur lors de loginTrainer:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });
      throw error;
    })
  );
}

// Méthode utilitaire pour nettoyer les données temporaires
clearTempData(): void {
  localStorage.removeItem('pendingTrainer');
  localStorage.removeItem('tempSetupData');
}

// Méthode pour vérifier si un formateur est en attente de 2FA
hasPendingTrainer(): boolean {
  return !!localStorage.getItem('pendingTrainer');
}

// Méthode pour récupérer le formateur en attente
getPendingTrainer(): any {
  const data = localStorage.getItem('pendingTrainer');
  return data ? JSON.parse(data) : null;
}
// Méthodes à ajouter/modifier dans votre AuthService

// CORRECTION: Méthode verify2FA mise à jour
verify2FA(matricule: string, requestBody: any): Observable<any> {
  const url = `https://training-backend-1pda.onrender.com/auth/2fa/verify/${matricule}`;
  
  console.log('Sending verify2fa request (login):', { url, body: requestBody });
  
  return this.http.post<any>(url, requestBody).pipe(
    tap(response => {
      console.log('verify2fa response:', response);
    }),
    catchError(error => {
      console.error('Erreur lors de verify2fa (login):', error);
      return throwError(() => error);
    })
  );
}

// Version alternative si vous voulez garder l'ancienne signature
verify2faAlternative(matricule: string, totpCode: string, method: string = 'totp'): Observable<any> {
  const requestBody = {
    totp_code: totpCode,
    is_login: true
  };
  
  return this.verify2FA(matricule, requestBody);
}

// NOUVELLE MÉTHODE: Pour la configuration 2FA setup
verifyTotpSetup(matricule: string, totpCode: string, secretKey?: string): Observable<any> {
  const requestBody = {
    totp_code: totpCode,
    secret_key: secretKey,
    is_login: false
  };
  
  return this.verify2FA(matricule, requestBody);
}
}