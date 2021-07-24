import { TestBed } from '@angular/core/testing';

import { WalletsOperationsService } from './wallets-operations.service';

describe('WalletsOperationsService', () => {
  let service: WalletsOperationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletsOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
