import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletTransactionItemComponent } from './wallet-transaction-item.component';

describe('WalletTransactionItemComponent', () => {
  let component: WalletTransactionItemComponent;
  let fixture: ComponentFixture<WalletTransactionItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletTransactionItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletTransactionItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
