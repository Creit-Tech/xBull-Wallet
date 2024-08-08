import { TestBed } from '@angular/core/testing';

import { StateChangesService } from './state-changes.service';

describe('StateChangesService', () => {
  let service: StateChangesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateChangesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
