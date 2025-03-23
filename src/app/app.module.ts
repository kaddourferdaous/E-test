import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';  
import { HttpClientModule } from '@angular/common/http';
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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule, 
    HttpClientModule,

  // Bibliothèque de visionnage PDF

    FormsModule, 
    RouterModule.forRoot(appRoutes),  // Utilisation de routes définies dans appRoutes
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Si vous utilisez des Web Components ou des composants non Angular
})
export class AppModule { }
