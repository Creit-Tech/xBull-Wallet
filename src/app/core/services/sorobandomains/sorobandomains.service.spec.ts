import { TestBed } from '@angular/core/testing';

import { SorobandomainsService } from './sorobandomains.service';

describe('SorobandomainsService', () => {
  let service: SorobandomainsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SorobandomainsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
