import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiveFundsComponent } from './receive-funds.component';

describe('ReceiveFundsComponent', () => {
  let component: ReceiveFundsComponent;
  let fixture: ComponentFixture<ReceiveFundsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiveFundsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiveFundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
