import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchLiquidityPoolsComponent } from './search-liquidity-pools.component';

describe('SearchLiquidityPoolsComponent', () => {
  let component: SearchLiquidityPoolsComponent;
  let fixture: ComponentFixture<SearchLiquidityPoolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchLiquidityPoolsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchLiquidityPoolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
