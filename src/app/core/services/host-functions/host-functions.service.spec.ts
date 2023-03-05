import { TestBed } from '@angular/core/testing';

import { HostFunctionsService } from './host-functions.service';

describe('HostFunctionsService', () => {
  let service: HostFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HostFunctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
