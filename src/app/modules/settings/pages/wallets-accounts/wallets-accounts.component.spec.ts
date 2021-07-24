import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletsAccountsComponent } from './wallets-accounts.component';

describe('WalletsAccountsComponent', () => {
  let component: WalletsAccountsComponent;
  let fixture: ComponentFixture<WalletsAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletsAccountsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletsAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
