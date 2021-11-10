import { TestBed } from '@angular/core/testing';

import { LiquidityPoolsService } from './liquidity-pools.service';

describe('LiquidityPoolsService', () => {
  let service: LiquidityPoolsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiquidityPoolsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
