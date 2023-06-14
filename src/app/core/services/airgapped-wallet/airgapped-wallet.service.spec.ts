import { TestBed } from '@angular/core/testing';

import { AirgappedWalletService } from './airgapped-wallet.service';

describe('AirgappedWalletService', () => {
  let service: AirgappedWalletService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirgappedWalletService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
