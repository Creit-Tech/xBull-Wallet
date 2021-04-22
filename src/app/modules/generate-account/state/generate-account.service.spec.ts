import { TestBed } from '@angular/core/testing';

import { GenerateAccountService } from './generate-account.service';

describe('GenerateAccountService', () => {
  let service: GenerateAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenerateAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
