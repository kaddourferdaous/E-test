import { TestBed } from '@angular/core/testing';

import { ResponseDisplayService } from './response-display.service';

describe('ResponseDisplayService', () => {
  let service: ResponseDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResponseDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
