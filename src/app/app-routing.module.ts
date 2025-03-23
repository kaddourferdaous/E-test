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


const routes: Routes = [
  { path: '', redirectTo: '/entryPage', pathMatch: 'full' },
  { path: 'entryPage', component: EntryPageComponent }, // Page avant login
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {path:'trainerSignUp',component :TrainerSignUpComponent},
  {path:'trainerLogin',component:TrainerLoginComponent},
  {path:'dashboard',component:DashboardComponent},
  {path:'category',component:CategoryComponent},
  { path: 'videoList', component: VideoListComponent },
  { path: 'video/:filename', component: VideoDetailComponent },
  {path:'supp',component:SupportListComponent},
  {path:'test',component:TestComponent},
  {path:'supports',component:SupportsComponent},
  { path: 'supports/view', component: SupportListComponent },
  { path: 'model-detail/:modelName', component: ModelDetailComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },  // Protection de la route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
