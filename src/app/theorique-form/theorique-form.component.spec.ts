import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TheoriqueFormComponent } from './theorique-form.component';

describe('TheoriqueFormComponent', () => {
  let component: TheoriqueFormComponent;
  let fixture: ComponentFixture<TheoriqueFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TheoriqueFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TheoriqueFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
