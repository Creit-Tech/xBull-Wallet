import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimableBalancesDashboardComponent } from './claimable-balances-dashboard.component';

describe('ClaimableBalancesDashboardComponent', () => {
  let component: ClaimableBalancesDashboardComponent;
  let fixture: ComponentFixture<ClaimableBalancesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClaimableBalancesDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaimableBalancesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
