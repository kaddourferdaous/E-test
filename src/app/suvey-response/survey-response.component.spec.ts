import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuveyResponseComponent } from './survey-response.component';

describe('SuveyResponseComponent', () => {
  let component: SuveyResponseComponent;
  let fixture: ComponentFixture<SuveyResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuveyResponseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuveyResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
