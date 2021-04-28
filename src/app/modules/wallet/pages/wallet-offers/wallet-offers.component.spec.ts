import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletOffersComponent } from './wallet-offers.component';

describe('WalletOffersComponent', () => {
  let component: WalletOffersComponent;
  let fixture: ComponentFixture<WalletOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletOffersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
