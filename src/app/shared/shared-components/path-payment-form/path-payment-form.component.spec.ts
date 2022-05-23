import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathPaymentFormComponent } from './path-payment-form.component';

describe('PathPaymentFormComponent', () => {
  let component: PathPaymentFormComponent;
  let fixture: ComponentFixture<PathPaymentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PathPaymentFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PathPaymentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
