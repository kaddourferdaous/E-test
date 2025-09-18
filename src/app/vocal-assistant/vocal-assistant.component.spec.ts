import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VocalAssistantComponent } from './vocal-assistant.component';

describe('VocalAssistantComponent', () => {
  let component: VocalAssistantComponent;
  let fixture: ComponentFixture<VocalAssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VocalAssistantComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VocalAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
