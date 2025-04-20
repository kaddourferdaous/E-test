import { Injectable } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { TranslationApiService } from './translation-api.service';

@Injectable()
export class ApiTranslateLoader implements TranslateLoader {
  constructor(private apiService: TranslationApiService) {}

  getTranslation(lang: string): Observable<any> {
    return this.apiService.getTranslations(lang);
  }
}