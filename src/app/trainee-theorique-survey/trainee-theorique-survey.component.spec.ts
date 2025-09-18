import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraineeTheoriqueSurveyComponent } from './trainee-theorique-survey.component';

describe('TraineeTheoriqueSurveyComponent', () => {
  let component: TraineeTheoriqueSurveyComponent;
  let fixture: ComponentFixture<TraineeTheoriqueSurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraineeTheoriqueSurveyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraineeTheoriqueSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
