import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationApiService {

  // URL de l'API LibreTranslate
  private readonly API_URL = 'https://libretranslate.de/translate'; // URL de l'API LibreTranslate

  constructor(private http: HttpClient) {}

  // Récupérer les langues supportées
  getSupportedLanguages(): Observable<any> {
    return this.http.get('https://libretranslate.de/languages');
  }

  // Traduire le texte
  translateText(text: string, sourceLang: string, targetLang: string): Observable<any> {
    const body = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    };
    return this.http.post<any>(this.API_URL, body);
  }
}