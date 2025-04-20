// candidate.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private candidateIdSource = new BehaviorSubject<string>('');
  currentCandidateId = this.candidateIdSource.asObservable();

  updateCandidateId(candidateId: string) {
    this.candidateIdSource.next(candidateId);
  }
}