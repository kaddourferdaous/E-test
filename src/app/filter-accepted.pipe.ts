import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterAccepted'
})
export class FilterAcceptedPipe implements PipeTransform {
  transform(candidates: any[], threshold: number): any[] {
    if (!candidates) return [];
    return candidates.filter(candidate => candidate.final_test_percentage >= threshold);
  }
}