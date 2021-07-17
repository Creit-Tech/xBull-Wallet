import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisteredWalletDetailsComponent } from './registered-wallet-details.component';

describe('RegisteredWalletDetailsComponent', () => {
  let component: RegisteredWalletDetailsComponent;
  let fixture: ComponentFixture<RegisteredWalletDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisteredWalletDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisteredWalletDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
