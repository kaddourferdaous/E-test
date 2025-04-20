import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PratiqueFormComponent } from './pratique-form.component';

describe('PratiqueFormComponent', () => {
  let component: PratiqueFormComponent;
  let fixture: ComponentFixture<PratiqueFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PratiqueFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PratiqueFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
