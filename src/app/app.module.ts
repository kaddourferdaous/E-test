import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, LOCALE_ID } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';  
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
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
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ContactComponent } from './contact/contact.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { FeedbacksComponent } from './feedbacks/feedbacks.component';
import { SurveysComponent } from './surveys/surveys.component';
import { TheoriqueFormComponent } from './theorique-form/theorique-form.component';
import { PratiqueFormComponent } from './pratique-form/pratique-form.component';
import { CandidatsComponent } from './candidats/candidats.component';
import { OjtFormComponent } from './ojt-form/ojt-form.component';
import { FollowUpComponent } from './follow-up/follow-up.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http,'https://cors-anywhere.herokuapp.com/https://libretranslate.com/translate', '');
}


const appRoutes: Routes = [
  { path: 'category', component: CategoryComponent },
  { path: '', component: HomeComponent },  // La page d'accueil
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'trainer-login', component: TrainerLoginComponent },
  { path: 'trainer-signup', component: TrainerSignUpComponent },
  { path: 'dashboard', component: DashboardComponent },

  { path: 'test', component: TestComponent },
];

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
    FollowUpComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
   HttpClientModule,
   TranslateModule.forRoot({
    loader:{
      provide:TranslateLoader,
      useFactory:HttpLoaderFactory,
      deps:[HttpClient]
    }
   })
  ],
  providers: [
   
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {

  // constructor(translate: TranslateService) {
  //   const defaultLang = 'ar'; // Arabe par défaut
  //   translate.addLangs(['ar', 'en']); // Langues disponibles
  //   translate.setDefaultLang(defaultLang);
  //   translate.use(defaultLang);
  //   document.documentElement.lang = defaultLang;
  //   document.documentElement.dir = defaultLang === 'ar' ? 'rtl' : 'ltr';
  // }
  
 }
