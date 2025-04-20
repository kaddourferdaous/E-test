import { Component } from '@angular/core';
import { TranslationService } from './translation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  originalText: string = '';
  translatedText: string = '';
  selectedLang: string = 'ar';

  constructor(private translationService: TranslationService) {}

  translate() {
    if (this.originalText.trim()) {
      this.translationService
        .translateText(this.originalText, this.selectedLang)
        .subscribe({
          next: (response) => {
            this.translatedText = response.translations.translation;
          },
          error: (err) => {
            console.error('Erreur lors de la traduction', err);
          }
        });
    }
  }
}
