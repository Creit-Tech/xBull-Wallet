import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignPasswordComponent } from './sign-password.component';

describe('SignPasswordComponent', () => {
  let component: SignPasswordComponent;
  let fixture: ComponentFixture<SignPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SignPasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
