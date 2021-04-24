import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmPhrasePasswordComponent } from './confirm-phrase-password.component';

describe('ConfirmPhrasePasswordComponent', () => {
  let component: ConfirmPhrasePasswordComponent;
  let fixture: ComponentFixture<ConfirmPhrasePasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmPhrasePasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPhrasePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
