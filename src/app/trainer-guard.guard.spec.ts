import { TestBed } from '@angular/core/testing';

import { TrainerGuardGuard } from './trainer-guard.guard';

describe('TrainerGuardGuard', () => {
  let guard: TrainerGuardGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(TrainerGuardGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
