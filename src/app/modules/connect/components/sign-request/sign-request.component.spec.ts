import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignRequestComponent } from './sign-request.component';

describe('SignRequestComponent', () => {
  let component: SignRequestComponent;
  let fixture: ComponentFixture<SignRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SignRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
