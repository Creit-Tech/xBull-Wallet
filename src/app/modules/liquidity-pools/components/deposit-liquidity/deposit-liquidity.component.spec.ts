import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositLiquidityComponent } from './deposit-liquidity.component';

describe('DepositLiquidityComponent', () => {
  let component: DepositLiquidityComponent;
  let fixture: ComponentFixture<DepositLiquidityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepositLiquidityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositLiquidityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
