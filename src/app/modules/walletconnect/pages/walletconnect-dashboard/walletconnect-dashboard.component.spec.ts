import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletConnectDashboardComponent } from './walletconnect-dashboard.component';

describe('WalletConnectDashboardComponent', () => {
  let component: WalletConnectDashboardComponent;
  let fixture: ComponentFixture<WalletConnectDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletConnectDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WalletConnectDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
