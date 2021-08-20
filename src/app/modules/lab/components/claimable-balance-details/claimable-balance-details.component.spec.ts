import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimableBalanceDetailsComponent } from './claimable-balance-details.component';

describe('ClaimableBalanceDetailsComponent', () => {
  let component: ClaimableBalanceDetailsComponent;
  let fixture: ComponentFixture<ClaimableBalanceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClaimableBalanceDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaimableBalanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
