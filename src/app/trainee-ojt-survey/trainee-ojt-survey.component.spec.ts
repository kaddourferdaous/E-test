import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraineeOjtSurveyComponent } from './trainee-ojt-survey.component';

describe('TraineeOjtSurveyComponent', () => {
  let component: TraineeOjtSurveyComponent;
  let fixture: ComponentFixture<TraineeOjtSurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraineeOjtSurveyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraineeOjtSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
