import { TestBed } from '@angular/core/testing';

import { ModalsService } from './modals.service';

describe('ModalsService', () => {
  let service: ModalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
