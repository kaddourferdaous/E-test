import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

interface Candidate {
  _id: string;
  nom: string;
  email: string;
  test1?: { score: number, percentage: number };
  test2?: { score: number, percentage: number };
  final_test?: { score: number, percentage: number };
}

interface TestResponse {
  type: any;
  processedData: any;
  maxScore: any;
  score: any;
  correct_answer: unknown;
  question: string;
  answer: string[];
  correct: boolean;
  // Nouvelles propriétés pour le template
  questionText?: string;
  questionId?: string;
  question_id?: string;
  possibleScore?: number;
  details?: string;
  answers?: any[];
  options?: string[];
  correctIndices?: number[];
  responses?: any[];
  correctResponses?: any[];
  correctAnswers?: any;
  orderMapping?: any;
}

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit {
  candidates: Candidate[] = [];
  candidateId: string = '';
  testType: string = '';
  responseData: any = null;
  loading: boolean = true;
  error: string = '';
  searchText: string = '';
  filterTest1 = 'all';
  filterTest2 = 'all';
  filterFinal = 'all';
  filterStatus = 'all';
  errorMessage: string = '';
  private apiUrl = 'http://localhost:5000/api';
  questions: any[] = [];
  libreAnswers: { [key: string]: string } = {};
  userOrder: { [key: string]: number } = {};
  blankAnswers: { [key: string]: string } = {};
  isSubmitted: boolean = false;
  useFullWidth: boolean = true;
  
  // Correction: variable pour les réponses du candidat
  candidateResponses: TestResponse[] = [];
  // Cette variable sera utilisée dans le template
  responses: TestResponse[] = [];
  
  selectedCandidate: Candidate | null = null;
  selectedTestType: string = '';
  showResponsesModal: boolean = false;
  loadingResponses: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('Component initialized');
    this.loadCandidates();
    this.route.paramMap.subscribe(params => {
      this.candidateId = params.get('id') || '';
      console.log('Candidate ID:', this.candidateId);
    });
  }

  isAnswerSelectedByIndex(question: any, index: number): boolean {
    return question.selectedAnswers?.includes(index) || false;
  }

  toggleAnswerByIndex(question: any, index: number, event: any): void {
    if (!question.selectedAnswers) question.selectedAnswers = [];
    if (event.target.checked) {
      question.selectedAnswers.push(index);
    } else {
      question.selectedAnswers = question.selectedAnswers.filter((i: number) => i !== index);
    }
  }

  updateLibreAnswer(questionId: string, answer: string): void {
    this.libreAnswers[questionId] = answer;
  }

  updateOrderAnswer(questionId: string, texteEtape: string, event: any): void {
    this.userOrder[texteEtape] = parseInt(event.target.value, 10);
  }

  updateBlankAnswer(questionId: string, position: number, value: string): void {
    this.blankAnswers[`${questionId}_${position}`] = value;
  }

  hasMultipleInputs(question: any, gauche: any): boolean {
    return question.multipleInputs?.[gauche.texte] || false;
  }

  getInputIndices(question: any, gauche: any): number[] {
    const count = question.multipleInputs?.[gauche.texte] || 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  getInputValue(question: any, gauche: any, inputIndex: number): string {
    return this.blankAnswers[`${question._id}_${gauche.texte}_${inputIndex}`] || '';
  }

  updateInputValue(question: any, gauche: any, inputIndex: number, value: string): void {
    this.blankAnswers[`${question._id}_${gauche.texte}_${inputIndex}`] = value;
  }

  loadCandidates(): void {
    console.log('Loading candidates...');
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/answers/get_all_candidates_scores`).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        if (response.success) {
          this.candidates = response.candidates;
          console.log('Candidates loaded:', this.candidates.length);
          this.loading = false;
        } else {
          this.error = 'Erreur lors du chargement des candidats';
          console.error('API error:', response.message || 'No error message');
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('HTTP Error:', err);
        this.error = 'Erreur de connexion au serveur';
        this.loading = false;
      }
    });
  }

  isComplete(candidate: any): boolean {
    return candidate.test1 && candidate.test2 && candidate.final_test;
  }

  viewResponses(candidateId: string, testType: string): void {
    console.log('View responses called for:', candidateId, 'Test type:', testType);
    this.loadingResponses = true;
    this.errorMessage = '';
    this.candidateResponses = [];
    this.responses = [];
    this.selectedCandidate = this.candidates.find(c => c._id === candidateId) || null;
    this.selectedTestType = testType;

    let apiTestType: string = testType === 'final' ? 'test-final' : testType;
    const url = `${this.apiUrl}/answers/get_candidate_responses`;

    console.log('Loading responses for:', candidateId, 'Type:', apiTestType);

    this.http
      .get(url, {
        params: new HttpParams()
          .set('candidate_id', candidateId)
          .set('test_type', apiTestType),
        observe: 'response',
      })
      .subscribe({
        next: (response: any) => {
          this.loadingResponses = false;
          console.log('Server response (viewResponses):', response);

          if (response.body && response.body.success) {
            console.log('Response body:', response.body);

            if (response.body.results && response.body.results.length > 0) {
              const submissions = response.body.results[0].submissions || [];
              const optionLabels = response.body.results[0].optionLabels || {};
              const questionTexts = response.body.results[0].questionTexts || {};

              this.candidateResponses = this.normalizeResponses(submissions, optionLabels, questionTexts);
              this.responses = this.candidateResponses;
              console.log('Responses loaded:', this.responses.length);

              this.showResponsesModal = true;

              if (this.responses.length === 0) {
                console.warn('No responses found');
                this.errorMessage = 'Aucune réponse trouvée pour ce candidat et ce type de test.';
              }
            } else {
              console.warn('Invalid response structure:', response.body);
              this.errorMessage = 'Structure de réponse invalide';
            }
          } else {
            const message = response.body ? response.body.message : 'Réponse invalide du serveur';
            console.error('API error message:', message);
            this.errorMessage = message;
          }
        },
        error: (error) => {
          console.error('Error retrieving responses:', error);
          this.loadingResponses = false;
          this.errorMessage = `Erreur de connexion au serveur (${error.status}).`;
        },
      });
  }

  normalizeResponses(submissions: any[], optionLabels: { [key: string]: string } = {}, questionTexts: { [key: string]: string } = {}): TestResponse[] {
    return submissions.map((submission, index) => {
      const type = submission.type;
      const questionId = submission.questionId || submission.question_id || `Question ${index + 1}`;
      let question = questionTexts[questionId] || questionId;
      let answer = '';
      let correct = false;
      let correctAnswer = '';
      let score = submission.score || 0;
      let maxScore = submission.maxScore || submission.possibleScore || submission.possible_score || 1;
      let details = submission.details || '';
      
      // Initialisation de l'objet de réponse avec toutes les propriétés nécessaires
// Initialisation de l'objet de réponse avec toutes les propriétés nécessaires
const normalizedResponse: TestResponse = {
  type: type.toLowerCase(),
  processedData: null,
  maxScore,
  score,
  correct_answer: '',
  question,
  answer: [],
  correct: false,
  questionText: question,
  questionId: questionId,
  question_id: questionId,
  possibleScore: maxScore,
  details,
  // Initialiser toutes les propriétés optionnelles avec des valeurs par défaut
  answers: [],
  options: [],
  correctIndices: [],
  responses: [],
  correctResponses: [],
  correctAnswers: null,
  orderMapping: null
};
      // Normalisation selon le type de question
      switch (type.toLowerCase()) {
        case 'appariement':
          const groupedAnswers: { [key: string]: any[] } = {};
          (submission.answers || []).forEach((ans: any) => {
            const key = ans.option_gauche_id.toString();
            if (!groupedAnswers[key]) {
              groupedAnswers[key] = [];
            }
            groupedAnswers[key].push(ans);
          });

          const answerPairs: string[] = [];
          const correctPairs: string[] = [];
          let allCorrect = true;

          // Préparation des réponses pour le template
          normalizedResponse.answers = submission.answers || [];

          for (const [optionId, answers] of Object.entries(groupedAnswers)) {
            const optionLabel = optionLabels[optionId] || `Option ${optionId}`;
            const userAnswers = answers
              .map((ans: any) => {
                const inputIndex = ans.input_index;
                const userAnswer = ans.user_answer || 'Non fourni';
                return `Input ${inputIndex}: ${userAnswer}`;
              })
              .join(', ');
            const correctAnswers = answers
              .map((ans: any) => {
                const inputIndex = ans.input_index;
                const correctValues = Array.isArray(ans.correct_values) ? ans.correct_values.join(' / ') : ans.correct_values;
                return `Input ${inputIndex}: ${correctValues}`;
              })
              .join(', ');

            answerPairs.push(`${optionLabel}: ${userAnswers}`);
            correctPairs.push(`${optionLabel}: ${correctAnswers}`);

            const optionCorrect = answers.every((ans: any) => ans.is_correct);
            if (!optionCorrect) {
              allCorrect = false;
            }
          }

          answer = answerPairs.join('; ') || 'Non fourni';
          normalizedResponse.correct = allCorrect;
          normalizedResponse.correct_answer = correctPairs.join('; ') || 'Non disponible';
          
          // Enrichir les réponses avec les textes
         normalizedResponse.answers = (normalizedResponse.answers || []).map((ans: any) => ({
            ...ans,
            left_text: optionLabels[ans.option_gauche_id] || `Option ${ans.option_gauche_id}`
          }));
          
          normalizedResponse.processedData = {
            groupedAnswers,
            optionLabels
          };
          break;

        case 'qcm':
          const selectedAnswers = submission.answers || [];
          const correctIndices = submission.correctIndices || [];
          const correctSelected = submission.correctSelected || 0;
          const incorrectSelected = submission.incorrectSelected || 0;

          normalizedResponse.answers = selectedAnswers;
          normalizedResponse.correctIndices = correctIndices;
          normalizedResponse.options = submission.options || [];
          answer = `Réponses sélectionnées: ${selectedAnswers.join(', ')}`;
          normalizedResponse.correct_answer = `Réponses correctes: ${correctIndices.join(', ')}`;
          normalizedResponse.correct = (correctSelected === correctIndices.length && incorrectSelected === 0);
          
          normalizedResponse.processedData = {
            selectedAnswers,
            correctIndices,
            correctSelected,
            incorrectSelected
          };
          break;

        case 'ordonner':
          const orderMapping = submission.orderMapping || {};
          const userAnswers = submission.answers || {};
          const validPositionsCount = submission.validPositionsCount || 0;
          const correctCount = submission.correctCount || 0;

          normalizedResponse.answers = userAnswers;
          normalizedResponse.orderMapping = orderMapping;

          const orderAnswers: string[] = [];
          for (const [label, position] of Object.entries(userAnswers)) {
            orderAnswers.push(`${label}: position ${position}`);
          }

          answer = orderAnswers.join(', ') || 'Non fourni';
          normalizedResponse.correct = (validPositionsCount === Object.keys(orderMapping).length && submission.completed);
          normalizedResponse.correct_answer = Object.entries(orderMapping).map(([pos, label]) => `${label}: position ${pos}`).join(', ');
          
          normalizedResponse.processedData = {
            orderMapping,
            userAnswers,
            correctCount,
            validPositionsCount,
            completed: submission.completed
          };
          break;
          
        case 'espaces_vides':
          const espaceAnswers = submission.answers || {};
          
          normalizedResponse.answers = espaceAnswers;
          normalizedResponse.correctAnswers = submission.correctAnswers || {};
          
          const answerItems: string[] = [];
          for (const [pos, val] of Object.entries(espaceAnswers)) {
            answerItems.push(`Espace ${pos}: ${val}`);
          }
          
          answer = answerItems.join(', ') || 'Non fourni';
          normalizedResponse.correct = (score === maxScore);
          
          normalizedResponse.processedData = {
            answers: espaceAnswers
          };
          break;

        case 'multi_vrai_faux':
          const responses = submission.responses || [];
          normalizedResponse.responses = responses;
          normalizedResponse.correctResponses = submission.correctResponses || [];
          
          const responseTexts: string[] = [];
          let totalResponded = 0;
          
          responses.forEach((resp: any) => {
            const texte = resp.texte_option || resp.texte_reponse || 'Option';
            const userAnswer = resp.userAnswer !== null ? 
              (resp.userAnswer === true ? 'Vrai' : 'Faux') : 
              'Non répondu';
            responseTexts.push(`"${texte}": ${userAnswer}`);
            
            if (resp.userAnswer !== null) {
              totalResponded++;
            }
          });
          
          answer = responseTexts.join('; ') || 'Non fourni';
          normalizedResponse.correct = (score === maxScore);
          
          normalizedResponse.processedData = {
            responses,
            totalResponded
          };
          break;

        case 'vrai_faux':
          const vfResponses = submission.responses || [];
          normalizedResponse.responses = vfResponses;
          
          const vfTexts: string[] = [];
          
          vfResponses.forEach((resp: any) => {
            const texte = resp.texte_reponse || 'Affirmation';
            const userAnswer = resp.userAnswer === true ? 'Vrai' : 'Faux';
            vfTexts.push(`"${texte}": ${userAnswer}`);
          });
          
          answer = vfTexts.join('; ') || 'Non fourni';
          normalizedResponse.correct = (score === maxScore);
          
          normalizedResponse.processedData = {
            responses: vfResponses
          };
          break;

        case 'libre':
          const userAnswer = submission.answer || '';
          const keywordsFound = submission.keywordsFound || [];
          
          normalizedResponse.answer = [userAnswer || 'Non fourni'];
          normalizedResponse.correct = (score === maxScore);
          
          normalizedResponse.processedData = {
            answer: userAnswer,
            keywordsFound
          };
          break;

        default:
          answer = JSON.stringify(submission) || 'Format non reconnu';
          normalizedResponse.processedData = submission;
      }

      // Assigner les valeurs finales
      normalizedResponse.answer = [answer];
      
      return normalizedResponse;
    });
  }

  isMatchingAnswer(answer: string[] | undefined): boolean {
    return !!answer && answer.length > 0 && answer[0].includes('Option');
  }

  splitPairs(answer: string[] | undefined): string[] {
    if (answer && answer.length > 0) {
      return answer[0].split('; ');
    }
    return [];
  }
  
  closeResponsesView(): void {
    console.log('Closing response view');
    this.showResponsesModal = false;
    this.candidateResponses = [];
    this.responses = [];
  }

  formatTestType(type: string): string {
    switch (type) {
      case 'jour1': return 'Test Jour 1';
      case 'jour2': return 'Test Jour 2';
      case 'final': return 'Test Final';
      default: return type;
    }
  }

  filteredCandidates(): Candidate[] {
    return this.candidates.filter(c => {
      const nameMatch = this.searchText ? c.nom.toLowerCase().includes(this.searchText.toLowerCase()) : true;
      const test1Match = this.filterTest1 === 'all' ||
        (this.filterTest1 === 'completed' && c.test1) ||
        (this.filterTest1 === 'not_completed' && !c.test1);
      const test2Match = this.filterTest2 === 'all' ||
        (this.filterTest2 === 'completed' && c.test2) ||
        (this.filterTest2 === 'not_completed' && !c.test2);
      const finalMatch = this.filterFinal === 'all' ||
        (this.filterFinal === 'completed' && c.final_test) ||
        (this.filterFinal === 'not_completed' && !c.final_test);
      const statusMatch = this.filterStatus === 'all' ||
        (this.filterStatus === 'complete' && this.isComplete(c)) ||
        (this.filterStatus === 'incomplete' && !this.isComplete(c));
      return nameMatch && test1Match && test2Match && finalMatch && statusMatch;
    });
  }

  debugResponse(candidateId: string, testType: string): void {
    console.log('Debug response for:', candidateId, 'Type:', testType);
    const url = `${this.apiUrl}/answers/get_candidate_responses`;
    this.http.get(url, {
      params: new HttpParams()
        .set('candidate_id', candidateId)
        .set('test_type', testType)
    }).subscribe(response => {
      console.log('Complete response structure:', response);
    });
  }

  // ----------- Formatage des réponses quiz --------------
  displayQuizResponses(jsonData: any): string {
    console.log('Formatting quiz responses:', jsonData);
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    let output = '# Résultats du Quiz\n\n';
    let totalScore = 0;
    let totalPossibleScore = 0;

    data.submissions.forEach((submission: { questionId: any; question_id: any; type: any; score: number; maxScore: any; possibleScore: any; possible_score: any; details: any; }, index: number) => {
      const id = submission.questionId || submission.question_id;
      const type = submission.type;
      const score = submission.score || 0;
      const maxScore = submission.maxScore || submission.possibleScore || submission.possible_score || 1;

      totalScore += score;
      totalPossibleScore += maxScore;

      output += `## Question ${index + 1} (ID: ${id})\n`;
      output += `**Type**: ${this.formatQuestionType(type)} | **Score**: ${score}/${maxScore}\n\n`;

      switch (type.toLowerCase()) {
        case 'qcm':
          output += this.formatQCM(submission);
          break;
        case 'ordonner':
          output += this.formatOrdonner(submission);
          break;
        case 'appariement':
          output += this.formatAppariement(submission);
          break;
        case 'espaces_vides':
          output += this.formatEspacesVides(submission);
          break;
        case 'multi_vrai_faux':
          output += this.formatMultiVraiFaux(submission);
          break;
        case 'vrai_faux':
          output += this.formatVraiFaux(submission);
          break;
        case 'libre':
          output += this.formatLibre(submission);
          break;
        default:
          output += '*Format de question non reconnu*\n\n';
      }

      if (submission.details) {
        output += `**Détails**: ${submission.details}\n\n`;
      }

      output += '---\n\n';
    });

    output += `# Résumé\n\n**Score total**: ${totalScore}/${totalPossibleScore} (${((totalScore / totalPossibleScore) * 100).toFixed(2)}%)\n\n`;
    return output;
  }

  formatQuestionType(type: string): string {
    const map: any = {
      qcm: 'Choix multiple',
      ordonner: 'Ordre',
      appariement: 'Appariement',
      espaces_vides: 'Espaces à remplir',
      multi_vrai_faux: 'Vrai/Faux multiple',
      vrai_faux: 'Vrai/Faux',
      libre: 'Réponse libre'
    };
    return map[type.toLowerCase()] || type;
  }

  formatQCM(submission: any): string {
    if (!submission.answers || submission.answers.length === 0) {
      return '❌ *Aucune réponse sélectionnée*\n\n';
    }
    let output = '';
    output += `**Réponses sélectionnées**: ${submission.answers.join(', ')}\n`;
    if (submission.correctAnswers) {
      output += `**Réponses correctes**: ${submission.correctAnswers.join(', ')}\n`;
    }
    output += '\n';
    return output;
  }

  formatOrdonner(submission: any): string {
    return `**Ordre donné**: ${submission.answers?.join(' → ') || 'Aucune'}\n\n`;
  }

  formatAppariement(submission: any): string {
    const pairs = submission.answers || [];
    return pairs.map((p: any) => `- ${p.left} ⇔ ${p.right}`).join('\n') + '\n\n';
  }

  formatEspacesVides(submission: any): string {
    return submission.answers?.map((a: string, i: number) => `- Vide ${i + 1}: ${a}`).join('\n') + '\n\n';
  }

  formatMultiVraiFaux(submission: any): string {
    return submission.answers?.map((a: any) => `- ${a.statement}: ${a.answer ? 'Vrai' : 'Faux'}`).join('\n') + '\n\n';
  }

  formatVraiFaux(submission: any): string {
    return `- ${submission.statement}: ${submission.answer ? 'Vrai' : 'Faux'}\n\n`;
  }

  formatLibre(submission: any): string {
    return `**Réponse saisie**: ${submission.answer || 'Aucune'}\n\n`;
  }
}