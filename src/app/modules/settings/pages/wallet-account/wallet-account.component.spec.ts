import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletAccountComponent } from './wallet-account.component';

describe('WalletAccountComponent', () => {
  let component: WalletAccountComponent;
  let fixture: ComponentFixture<WalletAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
