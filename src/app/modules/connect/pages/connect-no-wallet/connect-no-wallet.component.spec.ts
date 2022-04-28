import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectNoWalletComponent } from './connect-no-wallet.component';

describe('ConnectNoWalletComponent', () => {
  let component: ConnectNoWalletComponent;
  let fixture: ComponentFixture<ConnectNoWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectNoWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectNoWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
