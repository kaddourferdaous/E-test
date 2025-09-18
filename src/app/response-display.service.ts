import { Injectable } from '@angular/core';

export interface ResponseData {
  _id: string;
  candidate?: {
    id?: string;
    name?: string;
    email?: string;
  };
  submissions?: any[];
  results?: {
    score?: number;
    total?: number;
    percentage?: string | number;
  };
}

export interface ProcessedResponse {
  questionId: string;
  type: string;
  responseType: string;
  question?: string;
  answer?: any;
  score?: number;
  maxScore?: number;
  percentage?: number;
  isCorrect?: boolean;
  details?: string;
  formattedAnswer?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResponseDisplayService {

  constructor() { }

  /**
   * Traite les données de réponse brutes et les convertit en format standardisé
   */
  processResponseData(responseData: ResponseData): ProcessedResponse[] {
    if (!responseData || !responseData.submissions || !Array.isArray(responseData.submissions)) {
      console.error('Données de réponse invalides:', responseData);
      return [];
    }

    return responseData.submissions.map(submission => this.standardizeSubmission(submission));
  }

  /**
   * Convertit différents formats de soumission en format standardisé
   */
  private standardizeSubmission(submission: any): ProcessedResponse {
    // Identifier les propriétés communes indépendamment du format
    const questionId = submission.questionId || submission.question_id || '';
    const type = this.normalizeQuestionType(submission.type);
    const responseType = this.determineResponseType(submission);
    
    // Obtenir le score et le score maximum
    const score = submission.score !== undefined ? Number(submission.score) : 0;
    const maxScore = submission.maxScore || submission.possibleScore || submission.possible_score || 1;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    // Déterminer si la réponse est correcte
    const isCorrect = score >= maxScore * 0.7; // Considérer comme correct si >= 70%
    
    // Formater la réponse selon son type
    const formattedAnswer = this.formatAnswer(submission);
    
    return {
      questionId,
      type,
      responseType,
      question: submission.question_text || '',
      answer: submission.answers || submission.responses || submission.answer || submission.userAnswer || '',
      score,
      maxScore,
      percentage,
      isCorrect,
      details: submission.details || '',
      formattedAnswer
    };
  }
  
  /**
   * Normalise les types de questions pour éviter les variations
   */
  private normalizeQuestionType(type: string): string {
    if (!type) return 'UNKNOWN';
    
    const typeStr = type.toString().toLowerCase();
    
    if (typeStr.includes('qcm') || typeStr.includes('multiple-choice')) {
      return 'QCM';
    } else if (typeStr.includes('appariement') || typeStr.includes('matching')) {
      return 'APPARIEMENT';
    } else if (typeStr.includes('texte') || typeStr.includes('text') || typeStr === 'libre') {
      return 'TEXTE';
    } else if (typeStr.includes('vrai_faux') || typeStr.includes('vrai-faux') || typeStr.includes('multi_vrai_faux')) {
      return 'VRAI_FAUX';
    } else if (typeStr.includes('espaces') || typeStr.includes('vides')) {
      return 'ESPACES_VIDES';
    } else if (typeStr.includes('ordonner')) {
      return 'ORDONNER';
    }
    
    return typeStr.toUpperCase();
  }
  
  /**
   * Détermine le type d'affichage de la réponse
   */
  private determineResponseType(submission: any): string {
    // D'abord, utiliser le type normalisé
    const normalizedType = this.normalizeQuestionType(submission.type);
    
    // Ensuite, affiner selon la structure des données
    if (submission.correctIndices && Array.isArray(submission.correctIndices)) {
      return 'QCM';
    } else if (
      (submission.userMatches && Array.isArray(submission.userMatches)) || 
      (submission.answers && Array.isArray(submission.answers) && submission.answers[0]?.option_gauche_id)
    ) {
      return 'APPARIEMENT';
    } else if (submission.answer && typeof submission.answer === 'string' && submission.answer.length > 20) {
      return 'TEXTE_LIBRE';
    } else if (
      submission.responses && 
      Array.isArray(submission.responses) && 
      submission.responses[0]?.texte_option
    ) {
      return 'VRAI_FAUX';
    }
    
    return normalizedType;
  }
  
  /**
   * Formate la réponse selon son type pour l'affichage
   */
  private formatAnswer(submission: any): string {
    const type = this.normalizeQuestionType(submission.type);
    
    switch (type) {
      case 'QCM':
        if (submission.answers && Array.isArray(submission.answers)) {
          if (submission.answers.length === 0) {
            return 'Aucune réponse sélectionnée';
          }
          
          // Essayer d'obtenir les options textuelles si disponibles
          if (submission.options && Array.isArray(submission.options)) {
            const selectedOptions = submission.answers.map((idx: number) => 
              submission.options[idx]?.text || `Option ${idx + 1}`
            );
            return selectedOptions.join(', ');
          }
          
          return `Options sélectionnées: ${submission.answers.join(', ')}`;
        }
        return 'Donnée QCM non disponible';
        
      case 'APPARIEMENT':
        if (submission.answers && Array.isArray(submission.answers)) {
          // Format pour les questions d'appariement dans le nouvel API
          let result = '';
          
          for (const match of submission.answers) {
            const sourceId = match.option_gauche_id;
            const targetValue = match.user_answer || 'Non apparié';
            const correctValue = match.correct_values ? match.correct_values[1] || match.correct_values[0] : 'N/A';
            const status = match.is_correct ? '✓' : '✗';
            
            result += `${sourceId} → ${targetValue || '?'} ${status} (correct: ${correctValue})\n`;
          }
          
          return result || 'Aucun appariement effectué';
        }
        return 'Données d\'appariement non disponibles';
        
      case 'VRAI_FAUX':
        if (submission.responses && Array.isArray(submission.responses)) {
          return submission.responses.map((resp: any, index: number) => {
            const statement = resp.texte_option || resp.texte_reponse || `Affirmation ${index + 1}`;
            const answer = resp.userAnswer === true ? 'Vrai' : 
                          resp.userAnswer === false ? 'Faux' : 'Non répondu';
            return `${statement}: ${answer}`;
          }).join('\n');
        }
        return 'Données vrai/faux non disponibles';
        
      case 'TEXTE':
        return submission.answer || 'Aucune réponse textuelle';
        
      case 'ESPACES_VIDES':
        if (submission.answers && typeof submission.answers === 'object') {
          return Object.entries(submission.answers)
            .map(([key, value]) => `Espace ${key}: ${value}`)
            .join('\n');
        }
        return 'Données espaces vides non disponibles';
        
      case 'ORDONNER':
        if (submission.answers && typeof submission.answers === 'object') {
          if (submission.completed === false) {
            return 'Question non complétée';
          }
          
          return Object.entries(submission.answers)
            .map(([item, position]) => `${item}: Position ${position}`)
            .join('\n');
        }
        return 'Données d\'ordonnancement non disponibles';
        
      default:
        return JSON.stringify(submission.answers || submission.responses || submission.answer || 'Pas de réponse disponible');
    }
  }
  
  /**
   * Obtient l'icône correspondant au type de réponse
   */
  getResponseTypeIcon(type: string): string {
    switch(type) {
      case 'QCM': return 'list-check';
      case 'APPARIEMENT': return 'git-merge';
      case 'TEXTE': return 'file-text';
      case 'VRAI_FAUX': return 'toggle-right';
      case 'ESPACES_VIDES': return 'align-left';
      case 'ORDONNER': return 'list-ordered';
      default: return 'help-circle';
    }
  }
  
  /**
   * Obtient la classe CSS selon le pourcentage de score
   */
  getScoreClass(percentage: number): string {
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 60) return 'score-good';
    if (percentage >= 40) return 'score-average';
    return 'score-poor';
  }
}