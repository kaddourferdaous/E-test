import { Component } from '@angular/core';
import { TranslationService } from '../translation.service';

@Component({
  selector: 'app-entry-page',
  templateUrl: './entry-page.component.html',
  styleUrls: ['./entry-page.component.css']
})
export class EntryPageComponent {
  selectedLang = 'ar';
  translatedText = '';

  constructor(private translationService: TranslationService) {}

  translate() {
    this.translationService
      .translateText('Login', this.selectedLang)
      .subscribe(res => {
        this.translatedText = res.translations.translation;
      });
  }
}
