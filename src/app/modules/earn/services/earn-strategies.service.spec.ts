import { TestBed } from '@angular/core/testing';

import { EarnStrategiesService } from './earn-strategies.service';

describe('EarnStrategiesService', () => {
  let service: EarnStrategiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EarnStrategiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
