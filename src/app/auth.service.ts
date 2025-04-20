import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';

// Interface pour les questions
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

  // Ajoutez d'autres propriétés selon votre modèle
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000'; // URL de l'API backend
  isAuthenticated: boolean = false; // État d'authentification
  translate: any;

  constructor(private http: HttpClient) {}

  // --- Méthodes pour les candidats ---
  /**
   * Connexion d'un candidat
   * @param email L'email du candidat
   * @param password Le mot de passe du candidat
   * @returns Un Observable avec la réponse du serveur
   */
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/auth/candidate/login`, { email, password })
      .pipe(
        tap((response) => {
          console.log('Réponse du serveur:', response);

          // Vérifiez ici la structure de la réponse
          const candidate = response.candidate;
          if (candidate) {
            this.storeCandidateInfo(response.candidateId, response.token, candidate);
            this.isAuthenticated = true; // Mettre à jour l'état d'authentification
          } else {
            console.error('Aucune information du candidat trouvée dans la réponse');
          }
        }),
        catchError((error) => {
          console.error('Erreur lors de la connexion:', error);
          throw error; // Rethrow the error
        })
      );
  }
  changeLanguage(language: string) {
    this.translate.use(language); // Change la langue avec ngx-translate
    this.updateDirection(language); // Appelle la méthode qui met à jour la direction RTL/LTR
  }
  
  private updateDirection(language: string) {
    // Si la langue est arabe, applique le RTL, sinon LTR
    if (language === 'ar') {
      document.body.setAttribute('dir', 'rtl');
    } else {
      document.body.setAttribute('dir', 'ltr');
    }}

  /**
   * Inscription d'un candidat
   * @param data Les données du candidat (email, password, nom, etc.)
   * @returns Un Observable avec la réponse du serveur
   */
  signup(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/auth/candidate/signup`, data)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de l\'inscription:', error);
          throw error; // Rethrow the error
        })
      );
  }

  /**
   * Récupérer la liste des candidats
   * @returns Un Observable avec la liste des candidats
   */
  getCandidates(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/auth/candidates`)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la récupération des candidats:', error);
          throw error; // Rethrow the error
        })
      );
  }

  /**
   * Récupérer l'ID du candidat connecté
   * @returns L'ID du candidat ou null
   */
  getCandidateId(): string | null {
    return localStorage.getItem('candidateId');
  }

  // --- Méthodes pour les formateurs ---
  /**
   * Inscription d'un formateur
   * @param data Les données du formateur (email, password, matricule, etc.)
   * @returns Un Observable avec la réponse du serveur
   */
  createTrainer(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/auth/trainer/signup`, data)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de l\'inscription du formateur:', error);
          throw error; // Rethrow the error
        })
      );
  }

  /**
   * Connexion d'un formateur
   * @param credentials Les identifiants du formateur (matricule, password)
   * @returns Un Observable avec la réponse du serveur
   */
  loginTrainer(credentials: any): Observable<any> {
    console.log('Tentative de connexion formateur avec:', credentials.matricule);
    return this.http.post<any>(`${this.apiUrl}/auth/trainer/login`, credentials).pipe(
      tap((response) => {
        console.log('Réponse connexion formateur:', response);
        
        // Solution temporaire: générer un token simulé si absent
        const token = response.token || this.generateTempToken(response.id);
        
        localStorage.setItem('trainerToken', token);
        localStorage.setItem('trainerId', response.id);
        
        // Stocker les infos minimales du formateur
        const trainerInfo = {
          matricule: credentials.matricule,
          id: response.id
        };
        localStorage.setItem('trainerInfo', JSON.stringify(trainerInfo));
        
        this.isAuthenticated = true;
        console.log('Formateur authentifié avec token temporaire');
        this.printTrainerSessionInfo();

      }),
      catchError((error) => {
        console.error('Erreur de connexion:', error);
        throw error;
      })
    );
  }
  getTrainerId(): string | null {
    return localStorage.getItem('trainerId'); // Ou sessionStorage selon votre implémentation
  }
  getCandidatsByTrainerId(): Observable<any> {
    const trainerId = this.getTrainerId(); // méthode déjà existante
    return this.http.get<any>(`http://localhost:5000/candidat/get_candidats_by_trainer/${trainerId}`);
  }
  
  // Méthode pour générer un token temporaire (à supprimer en production)
  private generateTempToken(id: string): string {
    return `temp-token-${id}-${Date.now()}`;
  }
  
  // Méthode de vérification améliorée
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
  }

  // --- Méthodes d'authentification générale ---
  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns true si un token est présent, sinon false
   */


  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('candidateId');
    localStorage.removeItem('candidateInfo');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('candidateId');
    sessionStorage.removeItem('candidateInfo');
    this.isAuthenticated = false; // Mettre à jour l'état d'authentification
  }

  /**
   * Récupérer le token d'authentification
   * @returns Le token ou null
   */
  getAuthToken(): string | null {
    // Check localStorage first, then sessionStorage if needed
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      return localToken;
    }
    
    // If not found in localStorage, check sessionStorage
    return sessionStorage.getItem('authToken');
  }
  
  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns true si un token est présent et valide, sinon false
   */
  checkAuthentication(): boolean {
    const token = this.getAuthToken();
    
    // Additional validation can be added here, like checking token expiry
    // if (token && this.isTokenExpired(token)) {
    //   this.logout(); // Logout if token is expired
    //   return false;
    // }
    
    this.isAuthenticated = !!token; // Keep the isAuthenticated property in sync
    return this.isAuthenticated;
  }

  // --- Méthodes pour les supports et questions ---
  /**
   * Récupérer les catégories de supports
   * @returns Un Observable avec la liste des catégories
   */
  getCategories(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/supp/categories`)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la récupération des catégories de supports:', error);
          throw error; // Rethrow the error
        })
      );
  }

  /**
   * Récupérer les supports
   * @returns Un Observable avec la liste des supports
   */
 
  uploadSupport(payload: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/supports/add`, payload)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de l\'upload du support:', error);
          throw error; // Rethrow the error
        })
      );
  }

  /**
   * Récupérer les questions depuis l'API
   * @returns Un Observable avec la liste des questions
   */
// Dans votre service authService
getQuestions(language: string): Observable<Question[]> {
  const url = `http://localhost:5000/api/questions?langue=${language}`;  // Assurez-vous de bien intégrer la langue dans l'URL
  return this.http.get<Question[]>(url);
}

  /**
   * Sauvegarder les réponses du candidat
   * @param responses Les réponses à sauvegarder
   * @returns Un Observable avec la réponse du serveur
   */
  saveResponses(responses: any): Observable<any> {
    const url = `${this.apiUrl}/api/save-responses`; // Remplacez par l'URL de votre backend
    return this.http.post(url, responses);
  }

  // --- Méthodes privées ---
  /**
   * Stocker les informations du candidat
   * @param candidateId L'ID du candidat
   * @param token Le token d'authentification
   * @param candidate Les informations du candidat
   */
  private storeCandidateInfo(
    candidateId: string,
    token: string,
    candidate: any
  ): void {
    console.log('Storing candidate info:', candidate);

    // Stockage des informations dans le localStorage
    localStorage.setItem('candidateId', candidateId);
    localStorage.setItem('authToken', token);

    // Vérifiez si les informations nécessaires sont présentes avant de les stocker
    if (candidate.nom && candidate.email) {
      localStorage.setItem(
        'candidateInfo',
        JSON.stringify({
          id: candidateId,
          nom: candidate.nom,
          email: candidate.email,
        })
      );
    } else {
      console.error('Nom ou email manquant dans les données du candidat');
    }
  }
  getCandidateInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/candidates`);
  }
  getCandidateById(candidateId: string): Observable<Candidate> {
    return this.http.get<Candidate>(`apiUrl/auth/candidate/${candidateId}`);
  }
  getSupports(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/supp/supports`);
  }
}
