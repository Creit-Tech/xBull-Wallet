import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSecretPasswordComponent } from './confirm-secret-password.component';

describe('ConfirmSecretPasswordComponent', () => {
  let component: ConfirmSecretPasswordComponent;
  let fixture: ComponentFixture<ConfirmSecretPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmSecretPasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmSecretPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
