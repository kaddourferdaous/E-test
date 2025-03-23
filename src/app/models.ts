// export interface Question {
//   question: string;
//   options: string[];
//   reponse_correcte: string | string[];
//   type: string;
// }

export interface LocalQuestion {
  text: string;
  options: string[];
  correctAnswer: string[];
  type: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
}

export interface SavedResponse {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  responses: { question: string; answer: string | string[]; correct: boolean }[];
  score: number;
  responseDate: string;
}