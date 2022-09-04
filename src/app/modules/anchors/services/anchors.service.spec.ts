import { TestBed } from '@angular/core/testing';

import { AnchorsService } from './anchors.service';

describe('AnchorsService', () => {
  let service: AnchorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnchorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
