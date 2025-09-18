import { Component, OnInit, OnDestroy, TrackByFunction } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchResult, SearchService } from '../model-search.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  searchResults: SearchResult[] = [];
  isLoading: boolean = false;
  searchType: 'name' | 'expectation' = 'name';
  resultsCount: number = 0;

  private destroy$ = new Subject<void>();
trackByModelName: TrackByFunction<SearchResult> | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    // Récupérer les paramètres de recherche depuis l'URL
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.searchTerm = params['q'] || '';
      this.searchType = params['type'] || 'name';
      
      if (this.searchTerm) {
        this.performSearch();
      }
    });

    // S'abonner aux résultats de recherche
    this.searchService.searchResults$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.searchResults = results;
      this.resultsCount = results.length;
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  performSearch(): void {
    if (!this.searchTerm.trim()) return;
    
    this.isLoading = true;
    this.searchService.performSearch(this.searchTerm, this.searchType);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.updateUrlParams();
  }

  onSearchSubmit(): void {
    this.updateUrlParams();
    this.performSearch();
  }

  onSearchTypeChange(): void {
    this.updateUrlParams();
    this.performSearch();
  }

  updateUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        q: this.searchTerm, 
        type: this.searchType 
      },
      queryParamsHandling: 'merge'
    });
  }

  navigateToModel(modelName: string): void {
    this.router.navigate(['/support-list', modelName]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.resultsCount = 0;
    this.searchService.clearSearchResults();
    this.router.navigate(['/search'], { queryParams: {} });
  }

  // Méthodes utilitaires
  highlightSearchTerm(text: string): string {
    if (!this.searchTerm || !text) {
      return text;
    }
    
    const searchTerm = this.searchTerm.trim();
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Méthodes pour le texte bilingue
  splitBilingualText(text: string): [string, string] {
    if (!text) return ['', ''];
    const parts = text.split('\n').map(s => s.trim());
    return [parts[0] || '', parts[1] || ''];
  }

  getEnglishText(text: string): string {
    return this.splitBilingualText(text)[0];
  }

  getArabicText(text: string): string {
    return this.splitBilingualText(text)[1];
  }
}