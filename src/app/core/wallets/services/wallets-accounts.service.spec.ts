import { TestBed } from '@angular/core/testing';

import { WalletsAccountsService } from './wallets-accounts.service';

describe('WalletsAccountsService', () => {
  let service: WalletsAccountsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletsAccountsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
