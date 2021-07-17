import { TestBed } from '@angular/core/testing';

import { HorizonApisService } from './horizon-apis.service';

describe('HorizonApisService', () => {
  let service: HorizonApisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HorizonApisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
