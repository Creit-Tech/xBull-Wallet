import { TestBed } from '@angular/core/testing';

import { WalletsOffersService } from './wallets-offers.service';

describe('WalletsOffersService', () => {
  let service: WalletsOffersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletsOffersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
