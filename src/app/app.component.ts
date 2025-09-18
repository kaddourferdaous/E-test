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

}
