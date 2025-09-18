import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraineePratiqueSurveyComponent } from './trainee-pratique-survey.component';

describe('TraineePratiqueSurveyComponent', () => {
  let component: TraineePratiqueSurveyComponent;
  let fixture: ComponentFixture<TraineePratiqueSurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraineePratiqueSurveyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraineePratiqueSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
