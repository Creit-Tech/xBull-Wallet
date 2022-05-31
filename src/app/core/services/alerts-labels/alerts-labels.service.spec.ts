import { TestBed } from '@angular/core/testing';

import { AlertsLabelsService } from './alerts-labels.service';

describe('AlertsLabelsService', () => {
  let service: AlertsLabelsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertsLabelsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
