import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private apiUrl = 'https://translate-plus.p.rapidapi.com/translate';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'e7dedd9196msh5201dea1cdbf1bap108e07jsn61f328994ad5',
    'X-RapidAPI-Host': 'translate-plus.p.rapidapi.com'
  });

  constructor(private http: HttpClient) {}

  translateText(text: string, targetLang: string, sourceLang: string = 'auto'): Observable<any> {
    const body = {
      text: text,
      source: sourceLang,
      target: targetLang,
    };

    return this.http.post(this.apiUrl, body, { headers: this.headers });
  }
}
