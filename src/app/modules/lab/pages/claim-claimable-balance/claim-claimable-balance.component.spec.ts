import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimClaimableBalanceComponent } from './claim-claimable-balance.component';

describe('ClaimClaimableBalanceComponent', () => {
  let component: ClaimClaimableBalanceComponent;
  let fixture: ComponentFixture<ClaimClaimableBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClaimClaimableBalanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaimClaimableBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
