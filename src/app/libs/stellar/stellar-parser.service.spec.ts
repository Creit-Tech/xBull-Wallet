import { TestBed } from '@angular/core/testing';

import { StellarParserService } from './stellar-parser.service';

describe('StellarParserService', () => {
  let service: StellarParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StellarParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
