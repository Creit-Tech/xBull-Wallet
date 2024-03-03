import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptModalComponent } from './prompt-modal.component';

describe('PromptModalComponent', () => {
  let component: PromptModalComponent;
  let fixture: ComponentFixture<PromptModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PromptModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromptModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
