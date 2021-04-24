import { TestBed } from '@angular/core/testing';

import { HdWalletService } from './hd-wallet.service';

describe('HdWalletService', () => {
  let service: HdWalletService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HdWalletService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
