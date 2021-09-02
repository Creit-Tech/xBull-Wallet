import { TestBed } from '@angular/core/testing';

import { HardwareWalletsService } from './hardware-wallets.service';

describe('HardwareWalletsService', () => {
  let service: HardwareWalletsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HardwareWalletsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
