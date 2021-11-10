import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidityPoolsOverviewComponent } from './liquidity-pools-overview.component';

describe('LiquidityPoolsOverviewComponent', () => {
  let component: LiquidityPoolsOverviewComponent;
  let fixture: ComponentFixture<LiquidityPoolsOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiquidityPoolsOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LiquidityPoolsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
