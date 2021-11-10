import { TestBed } from '@angular/core/testing';

import { DeviceAuthService } from './device-auth.service';

describe('DeviceAuthService', () => {
  let service: DeviceAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
