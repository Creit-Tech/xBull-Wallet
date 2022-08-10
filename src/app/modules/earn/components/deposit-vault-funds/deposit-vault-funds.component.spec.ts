import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositVaultFundsComponent } from './deposit-vault-funds.component';

describe('DepositVaultFundsComponent', () => {
  let component: DepositVaultFundsComponent;
  let fixture: ComponentFixture<DepositVaultFundsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepositVaultFundsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositVaultFundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
