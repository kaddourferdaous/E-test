import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateResponsesComponent } from './candidate-responses.component';

describe('CandidateResponsesComponent', () => {
  let component: CandidateResponsesComponent;
  let fixture: ComponentFixture<CandidateResponsesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateResponsesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateResponsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
