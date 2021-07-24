import { TestBed } from '@angular/core/testing';

import { WalletsAssetsService } from './wallets-assets.service';

describe('WalletsAssetsService', () => {
  let service: WalletsAssetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletsAssetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
