import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectAirGappedWalletComponent } from './connect-air-gapped-wallet.component';

describe('ConnectAirGappedWalletComponent', () => {
  let component: ConnectAirGappedWalletComponent;
  let fixture: ComponentFixture<ConnectAirGappedWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectAirGappedWalletComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectAirGappedWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
