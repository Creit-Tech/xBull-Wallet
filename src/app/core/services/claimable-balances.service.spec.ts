import { TestBed } from '@angular/core/testing';

import { ClaimableBalancesService } from './claimable-balances.service';

describe('ClaimableBalancesService', () => {
  let service: ClaimableBalancesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClaimableBalancesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
