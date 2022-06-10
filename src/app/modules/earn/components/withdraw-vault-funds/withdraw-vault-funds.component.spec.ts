import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawVaultFundsComponent } from './withdraw-vault-funds.component';

describe('WithdrawVaultFundsComponent', () => {
  let component: WithdrawVaultFundsComponent;
  let fixture: ComponentFixture<WithdrawVaultFundsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WithdrawVaultFundsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawVaultFundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
