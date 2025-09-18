import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';  
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SignupComponent } from './signup/signup.component';
import { EntryPageComponent } from './entry-page/entry-page.component';
import { TrainerLoginComponent } from './trainer-login/trainer-login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TrainerSignUpComponent } from './trainer-sign-up/trainer-sign-up.component';
import { CategoryComponent } from './category/category.component';
import { HomeComponent } from './home/home.component';
import { TestComponent } from './test/test.component';
import { SupportsComponent } from './supports/supports.component';
import { VideoListComponent } from './video-list/video-list.component';
import { VideoDetailComponent } from './video-detail/video-detail.component';
import { SupportListComponent } from './support-list/support-list.component';
import { ModelDetailComponent } from './model-detail/model-detail.component';
import { RemoveExtensionPipe } from './remove-extension.pipe';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ContactComponent } from './contact/contact.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { FeedbacksComponent } from './feedbacks/feedbacks.component';
import { SurveysComponent } from './surveys/surveys.component';
import { TheoriqueFormComponent } from './theorique-form/theorique-form.component';
import { PratiqueFormComponent } from './pratique-form/pratique-form.component';
import { CandidatsComponent } from './candidats/candidats.component';
import { OjtFormComponent } from './ojt-form/ojt-form.component';
import { FollowUpComponent } from './follow-up/follow-up.component';
import { QuizComponent } from './quiz/quiz.component';
import { ResultComponent } from './result/result.component';
import { CandidateResponsesComponent } from './candidate-responses/candidate-responses.component';
import { TraineeTheoriqueSurveyComponent } from './trainee-theorique-survey/trainee-theorique-survey.component';
import { TraineePratiqueSurveyComponent } from './trainee-pratique-survey/trainee-pratique-survey.component';
import { TraineeOjtSurveyComponent } from './trainee-ojt-survey/trainee-ojt-survey.component';
import { SurveyResponseComponent } from './suvey-response/survey-response.component';
import { VocalAssistantComponent } from './vocal-assistant/vocal-assistant.component';
import { TranslationService } from './translation.service';
import { SettingsComponent } from './settings/settings.component';
import { FilterAcceptedPipe } from './filter-accepted.pipe';
import { SearchResultsComponent } from './search-results/search-results.component';
import { AboutComponent } from './about/about.component';
import { ProfilComponent } from './profil/profil.component';


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'https://cors-anywhere.herokuapp.com/https://libretranslate.com/translate', '');
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    EntryPageComponent,
    TrainerSignUpComponent,
    TrainerLoginComponent,
    DashboardComponent,
    CategoryComponent,
    HomeComponent,
    TestComponent,
    SupportsComponent,
    VideoListComponent,
    VideoDetailComponent,
    SupportListComponent,
    ModelDetailComponent,
    RemoveExtensionPipe,
    ContactComponent,
    CandidatesComponent,
    FeedbacksComponent,
    SurveysComponent,
    TheoriqueFormComponent,
    PratiqueFormComponent,
    CandidatsComponent,
    OjtFormComponent,
    FollowUpComponent,
    QuizComponent,
    ResultComponent,
    CandidateResponsesComponent,
    TraineeTheoriqueSurveyComponent,
    TraineePratiqueSurveyComponent,
    TraineeOjtSurveyComponent,
    SurveyResponseComponent,
    VocalAssistantComponent,
    SettingsComponent,
    FilterAcceptedPipe,
    SearchResultsComponent,
    AboutComponent,
    ProfilComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule, // This should contain all your routes
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ZXingScannerModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    TranslationService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
  // You can uncomment this constructor if you want to use it
  // constructor(translate: TranslateService) {
  //   const defaultLang = 'ar'; // Arabic by default
  //   translate.addLangs(['ar', 'en']); // Available languages
  //   translate.setDefaultLang(defaultLang);
  //   translate.use(defaultLang);
  //   document.documentElement.lang = defaultLang;
  //   document.documentElement.dir = defaultLang === 'ar' ? 'rtl' : 'ltr';
  // }
}