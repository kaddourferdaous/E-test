import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

// Type representing different form types
type FormType = 'theorique' | 'pratique' | 'ojt' | 'followUp';

@Component({
  selector: 'app-survey',
  templateUrl: './surveys.component.html',
  styleUrls: ['./surveys.component.css']
})
export class SurveysComponent implements OnInit {
  selectedForm: FormType | null = null;
  candidateId: string | null = null; // Store candidate ID in memory
  
  constructor(
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}
  
  ngOnInit(): void {
    this.retrieveCandidateId();
  }
  
  /**
   * Retrieves candidate ID from localStorage.
   */
  retrieveCandidateId(): void {
    this.candidateId = localStorage.getItem('selectedCandidateId');
    if (!this.candidateId) {
      alert('Erreur : ID du candidat non disponible. Veuillez sélectionner un candidat.');
      console.error('ID du candidat non trouvé dans localStorage.');
      this.router.navigate(['/candidates']);
    } else {
      console.log('ID du candidat récupéré avec succès:', this.candidateId);
      // Ensure it's always in localStorage
      localStorage.setItem('selectedCandidateId', this.candidateId);
    }
  }
  
  /**
   * Selects a form type.
   * @param formType The form type to select.
   */
  selectForm(formType: FormType): void {
    if (!this.candidateId) {
      // Check again if ID is available
      this.candidateId = localStorage.getItem('selectedCandidateId');
      
      if (!this.candidateId) {
        alert('Erreur : ID du candidat non disponible. Veuillez sélectionner un candidat.');
        return;
      }
    }
    
    // Make sure localStorage is updated before navigating
    localStorage.setItem('selectedCandidateId', this.candidateId);
    this.selectedForm = formType;
    console.log('Formulaire sélectionné:', this.selectedForm);
    console.log('ID du candidat actuel:', this.candidateId);
  }
  
  /**
   * Creates a ripple effect on button click
   * @param event Mouse click event
   */
  createRipple(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    
    const circle = this.renderer.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    const rect = button.getBoundingClientRect();
    
    this.renderer.addClass(circle, 'ripple');
    this.renderer.setStyle(circle, 'width', `${diameter}px`);
    this.renderer.setStyle(circle, 'height', `${diameter}px`);
    this.renderer.setStyle(circle, 'left', `${event.clientX - rect.left - radius}px`);
    this.renderer.setStyle(circle, 'top', `${event.clientY - rect.top - radius}px`);
    
    this.renderer.appendChild(button, circle);
    
    setTimeout(() => {
      this.renderer.removeChild(button, circle);
    }, 600);
  }
  
  /**
   * Resets form selection to return to cards.
   * Includes ripple effect on the back button.
   */
  resetSelectedForm(event?: MouseEvent): void {
    if (event) {
      this.createRipple(event);
    }
    
    // Reset selected form but maintain candidateId
    this.selectedForm = null;
    console.log('Retour aux cartes. Aucun formulaire sélectionné.');
    console.log('ID du candidat maintenu:', this.candidateId);
  }
}