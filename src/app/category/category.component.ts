import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent {
  categories: any[] = [];
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Récupérer les catégories au chargement du composant
    this.authService.getCategories().subscribe(
      (data) => {
        this.categories = data;  // Stocker les catégories dans la variable
        console.log('Categories:', this.categories);
      },
      (error) => {
        console.error('Erreur lors de la récupération des catégories', error);
      }
    );
  }

}
