import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { EntryPageComponent } from './entry-page/entry-page.component';
//import { AuthGuard } from './auth.guard';  // Importez l'AuthGuard
import { TrainerSignUpComponent } from './trainer-sign-up/trainer-sign-up.component';
import { TrainerLoginComponent } from './trainer-login/trainer-login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CategoryComponent } from './category/category.component';

import { TestComponent } from './test/test.component';
import { AuthGuard } from './auth.guard';
import { SupportsComponent } from './supports/supports.component';
import { VideoListComponent } from './video-list/video-list.component';
import { VideoDetailComponent } from './video-detail/video-detail.component';
import { SupportListComponent } from './support-list/support-list.component';
import { ModelDetailComponent } from './model-detail/model-detail.component';
import { ContactComponent } from './contact/contact.component';
import { CandidatesComponent } from './candidates/candidates.component';
import { FeedbacksComponent } from './feedbacks/feedbacks.component';
import { SurveysComponent } from './surveys/surveys.component';
import { PratiqueFormComponent } from './pratique-form/pratique-form.component';
import { TheoriqueFormComponent } from './theorique-form/theorique-form.component';
import { CandidatsComponent } from './candidats/candidats.component';
import { TrainerGuard } from './trainer.guard';
import { QuizComponent } from './quiz/quiz.component';
import { ResultComponent } from './result/result.component';
import { CandidateResponsesComponent } from './candidate-responses/candidate-responses.component';
import { TraineeTheoriqueSurveyComponent } from './trainee-theorique-survey/trainee-theorique-survey.component';
import { TraineePratiqueSurveyComponent } from './trainee-pratique-survey/trainee-pratique-survey.component';
import { TraineeOjtSurveyComponent } from './trainee-ojt-survey/trainee-ojt-survey.component';
import { SurveyResponseComponent } from './suvey-response/survey-response.component';
import { SettingsComponent } from './settings/settings.component';
import { AboutComponent } from './about/about.component';
import { ProfilComponent } from './profil/profil.component';
const routes: Routes = [
  { path: '', redirectTo: '/entryPage', pathMatch: 'full' },
  { path: 'entryPage', component: EntryPageComponent }, // Page avant login
  { path: 'login', component: LoginComponent },
  {path:'quiz',component:QuizComponent},
  { path: 'signup', component: SignupComponent },
  {path:'trainerSignUp',component :TrainerSignUpComponent},
  {path:'trainerLogin',component:TrainerLoginComponent},
  { path: 'dashboard', component: DashboardComponent, canActivate: [TrainerGuard] },
  {path:'category',component:CategoryComponent},
  { path: 'videoList', component: VideoListComponent },
  { path: 'video/:filename', component: VideoDetailComponent },
  {path:'supp',component:SupportListComponent},
  {path:'test',component:TestComponent},
  {path:'supports',component:SupportsComponent},
  {path:'contact',component:ContactComponent},
  { path: 'supports/view', component: SupportListComponent },
  { path: 'model-detail/:modelName', component: ModelDetailComponent },
  {path:'candidates',component:CandidatesComponent},
  {path:'feedbacks',component:FeedbacksComponent},
  {path:'surveys',component:SurveysComponent},
  {path:'pratiqueForm',component:PratiqueFormComponent},
  {path:'theoicForm',component:TheoriqueFormComponent},
  {path:'candidats',component:CandidatsComponent},
  {path:'result',component:ResultComponent},
  {path:'about',component:AboutComponent},
  // Pour l'approche 1
{ path: 'candidate-responses/:id', component: CandidateResponsesComponent },
{path:'candidate-responses',component:CandidateResponsesComponent},
{path:'traineeTheoriqueForm',component:TraineeTheoriqueSurveyComponent},
{path:'traineePratiqueForm',component:TraineePratiqueSurveyComponent},
{path:'traineeOjtForm',component:TraineeOjtSurveyComponent},
{path:'surveyResponse',component:SurveyResponseComponent},
{path:'settings',component:SettingsComponent},
// Ou pour l'approche 2
{ path: 'candidate-responses/:id/:type', component: CandidateResponsesComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] }, 
  {path:'profil',component:ProfilComponent},
  {
  path: 'candidate-profile/:id',component: ProfilComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
