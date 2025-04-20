import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OjtFormComponent } from './ojt-form.component';

describe('OjtFormComponent', () => {
  let component: OjtFormComponent;
  let fixture: ComponentFixture<OjtFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OjtFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OjtFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
