import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendFundsComponent } from './send-funds.component';

describe('SendFundsComponent', () => {
  let component: SendFundsComponent;
  let fixture: ComponentFixture<SendFundsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendFundsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SendFundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
