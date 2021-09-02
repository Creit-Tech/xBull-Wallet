import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectHardwareWalletComponent } from './connect-hardware-wallet.component';

describe('ConnectHardwareWalletComponent', () => {
  let component: ConnectHardwareWalletComponent;
  let fixture: ComponentFixture<ConnectHardwareWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectHardwareWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectHardwareWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
