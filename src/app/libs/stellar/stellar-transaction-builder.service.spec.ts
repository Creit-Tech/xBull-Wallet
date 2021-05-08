import { TestBed } from '@angular/core/testing';

import { StellarTransactionBuilderService } from './stellar-transaction-builder.service';

describe('StellarTransactionBuilderService', () => {
  let service: StellarTransactionBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StellarTransactionBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
