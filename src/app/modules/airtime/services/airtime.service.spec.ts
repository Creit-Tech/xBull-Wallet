import { TestBed } from '@angular/core/testing';

import { AirtimeService } from './airtime.service';

describe('AirtimeService', () => {
  let service: AirtimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirtimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
