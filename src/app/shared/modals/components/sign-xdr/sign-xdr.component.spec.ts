import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignXdrComponent } from './sign-xdr.component';

describe('SignXdrComponent', () => {
  let component: SignXdrComponent;
  let fixture: ComponentFixture<SignXdrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SignXdrComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignXdrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
