import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawLiquidityComponent } from './withdraw-liquidity.component';

describe('WithdrawLiquidityComponent', () => {
  let component: WithdrawLiquidityComponent;
  let fixture: ComponentFixture<WithdrawLiquidityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WithdrawLiquidityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawLiquidityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
