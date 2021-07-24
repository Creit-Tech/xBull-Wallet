import { TestBed } from '@angular/core/testing';

import { StellarSdkService } from './stellar-sdk.service';

describe('StellarSdkService', () => {
  let service: StellarSdkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StellarSdkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
