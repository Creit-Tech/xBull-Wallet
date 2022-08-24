import { TestBed } from '@angular/core/testing';

import { WalletConnectService } from './walletconnect.service';

describe('WalletConnectService', () => {
  let service: WalletConnectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletConnectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
