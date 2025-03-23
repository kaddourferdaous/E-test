import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

// Interface pour les questions récupérées depuis l'API
interface Question {
  _id: string;
  type: string;
  question: string;
  reponse_correcte: string | string[];
  note: number;
  options?: string[];
}

// Interface pour le format de question utilisé en local
interface LocalQuestion {
  text: string;
  options?: string[];
  correctAnswer?: number | number[]; // Peut être un seul index ou un tableau d'index
  type: string;
}

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
  currentQuestion: number = 1; // Index de la question en cours
  score: number = 0; // Score de l'utilisateur
  questions: LocalQuestion[] = []; // Liste des questions
  totalQuestions: number = 0; // Nombre total de questions
  progressWidth: string = '0%'; // Barre de progression
  candidateId: string = ''; // ID du candidat
  candidateName: string = ''; // Nom du candidat
  candidateEmail: string = ''; // Email du candidat
  selectedAnswers: { [questionIndex: number]: (number | string)[] } = {}; // Réponses sélectionnées (nombres ou chaînes)
  testFinished: boolean = false; // Indique si le test est terminé
  selectedLanguage: string = 'fr';  // Langue par défaut
  showResult = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadCandidateInfo(); // Charger les informations du candidat
    this.loadQuestions(); // Charger les questions
  }

  /**
   * Charge les informations du candidat depuis localStorage ou via une API
   */
  loadCandidateInfo(): void {
    const candidateInfo = localStorage.getItem('candidateInfo');
    
    if (candidateInfo) {
      try {
        // Parse les informations stockées dans localStorage
        const candidate = JSON.parse(candidateInfo);
        
        // Vérifie si les informations du candidat sont disponibles
        this.candidateId = candidate.id || 'Inconnu';
        this.candidateName = candidate.nom || 'Inconnu';
        this.candidateEmail = candidate.email || 'Inconnu';
        
        console.log('Informations du candidat chargées depuis localStorage:', {
          candidateId: this.candidateId,
          candidateName: this.candidateName,
          candidateEmail: this.candidateEmail
        });
      } catch (error) {
        console.error('Erreur lors du chargement des informations du candidat depuis localStorage:', error);
      }
    } else {
      console.log('Aucune information de candidat trouvée dans localStorage.');
      this.loadCandidateInfoFromAPI(); // Récupérer les informations via l'API
    }
  }

  /**
   * Récupère les informations du candidat via l'API
   */
  loadCandidateInfoFromAPI(): void {
    this.authService.getCandidateInfo().subscribe(
      (data: any) => {
        console.log('Informations du candidat chargées depuis l\'API:', data);
        this.candidateId = data.id || 'Inconnu';
        this.candidateName = data.nom || 'Inconnu';
        this.candidateEmail = data.email || 'Inconnu';

        // Stocker les informations dans localStorage pour une utilisation future
        localStorage.setItem('candidateInfo', JSON.stringify(data));
      },
      error => {
        console.error('Erreur lors du chargement des informations du candidat depuis l\'API:', error);
      }
    );
  }

  /**
   * Charge les questions depuis l'API et les transforme en format local
   */
  loadQuestions(): void {
    // Utiliser la langue sélectionnée pour récupérer les questions
    this.authService.getQuestions(this.selectedLanguage).subscribe(
      (data: Question[]) => {
        if (!data) return;
  
        this.questions = data.map(q => {
          if (q.type === 'qcm' && q.options && q.options.length > 0) {
            // Convertir la réponse correcte en tableau d'index
            const correctAnswer = Array.isArray(q.reponse_correcte)
              ? q.reponse_correcte.map(ans => q.options!.indexOf(ans))
              : [q.options!.indexOf(q.reponse_correcte)];
  
            return {
              text: q.question,
              options: q.options,
              correctAnswer: correctAnswer,
              type: 'qcm'
            };
          } else {
            return {
              text: q.question,
              type: 'libre'
            };
          }
        });
  
        this.totalQuestions = this.questions.length;
        this.updateProgress();
      },
      error => {
        console.error('Erreur lors du chargement des questions :', error);
      }
    );
  }
  

  /**
   * Passe à la question suivante
   */
  nextQuestion(): void {
    if (this.currentQuestion < this.totalQuestions) {
      this.currentQuestion++;
      this.updateProgress();
    }
  }

  /**
   * Revient à la question précédente
   */
  previousQuestion(): void {
    if (this.currentQuestion > 1) {
      this.currentQuestion--;
      this.updateProgress();
    }
  }

  /**
   * Met à jour la barre de progression
   */
  updateProgress(): void {
    this.progressWidth = `${(this.currentQuestion / this.totalQuestions) * 100}%`;
  }

  /**
   * Sélectionne ou désélectionne une réponse pour une question de type QCM
   */
  selectAnswer(optionIndex: number): void {
    const questionIndex = this.currentQuestion - 1;
    if (!this.selectedAnswers[questionIndex]) {
      this.selectedAnswers[questionIndex] = [];
    }

    const index = this.selectedAnswers[questionIndex].indexOf(optionIndex);
    if (index === -1) {
      this.selectedAnswers[questionIndex].push(optionIndex); // Ajouter la sélection
    } else {
      this.selectedAnswers[questionIndex].splice(index, 1); // Retirer la sélection
    }

    this.updateScore();
  }

  /**
   * Met à jour le score de l'utilisateur
   */
  updateScore(): void {
    let newScore = 0;
    this.questions.forEach((q, index) => {
      if (q.type === 'qcm' && q.correctAnswer !== undefined) {
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        const selected = this.selectedAnswers[index] || [];
        // Filtrer uniquement les réponses de type nombre (QCM)
        const selectedNumbers = selected.filter(ans => typeof ans === 'number') as number[];
        if (correctAnswers.every(ans => selectedNumbers.includes(ans))) {
          newScore++;
        }
      }
    });
    this.score = newScore;
  }

  /**
   * Vérifie si une option est sélectionnée pour une question donnée
   */
  isSelected(questionIndex: number, optionIndex: number): boolean {
    const selected = this.selectedAnswers[questionIndex] || [];
    // Filtrer uniquement les réponses de type nombre (QCM)
    const selectedNumbers = selected.filter(ans => typeof ans === 'number') as number[];
    return selectedNumbers.includes(optionIndex);
  }

  /**
   * Enregistre la réponse d'une question libre
   */
  saveFreeResponse(event: Event): void {
    const input = event.target as HTMLInputElement;
    const questionIndex = this.currentQuestion - 1;
    this.selectedAnswers[questionIndex] = [input.value]; // Stocker la réponse libre comme une chaîne
  }

  /**
   * Prépare et enregistre les réponses
   */
  prepareAndSaveResponses(): void {
    if (this.testFinished) {
      console.log("Le test est déjà terminé. Les réponses ont déjà été enregistrées.");
      return;
    }

    // Vérifiez que les informations du candidat sont disponibles
    if (!this.candidateId) {
      console.error("ID du candidat manquant !");
      return;
    }

    // Préparer les réponses pour l'envoi
    const responses: { question: string; answer: string | string[]; correct: boolean }[] = [];

    this.questions.forEach((q, index) => {
      const userAnswer = this.selectedAnswers[index] || [];
      let isCorrect = false;

      // Transformer les réponses en chaînes de caractères
      const formattedAnswer = userAnswer.map(ans => {
        if (typeof ans === 'number' && q.options) {
          // Pour les QCM, convertir l'index en texte
          return q.options[ans];
        } else {
          // Pour les réponses libres, utiliser directement la chaîne
          return ans.toString();
        }
      });

      // Vérifier si la réponse est correcte
      if (Array.isArray(q.correctAnswer)) {
        const correctAnswers = q.correctAnswer.map(ans => q.options![ans]);
        if (correctAnswers.sort().toString() === formattedAnswer.sort().toString()) {
          isCorrect = true;
        }
      } else if (q.correctAnswer !== undefined) {
        const correctAnswer = q.options![q.correctAnswer as number];
        if (correctAnswer === formattedAnswer[0]) {
          isCorrect = true;
        }
      }

      // Ajouter la réponse formatée
      responses.push({
        question: q.text,
        answer: formattedAnswer,
        correct: isCorrect
      });
    });

    // Préparer les données à envoyer au backend
    const dataToSend = {
      candidate: {
        id: this.candidateId,
        name: this.candidateName,
        email: this.candidateEmail
      },
      responses: responses,
      date: new Date().toISOString(), // Date actuelle
      score: this.score // Score calculé
    };

    console.log("Données envoyées au backend :", dataToSend); // Log pour déboguer

    // Envoyer les réponses au backend
    this.authService.saveResponses(dataToSend).subscribe(
      response => {
        console.log("Réponses enregistrées avec succès :", response);
        this.testFinished = true; // Marquer le test comme terminé
        this.showResult = true;
      },
      error => {
        console.error("Erreur lors de l'enregistrement des réponses :", error);
      }
    );
  }
  changeLanguage(language: string): void {
    this.selectedLanguage = language;
    this.loadQuestions();  // Recharger les questions dans la langue choisie
  }
}