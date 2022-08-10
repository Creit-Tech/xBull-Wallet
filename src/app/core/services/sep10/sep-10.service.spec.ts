import { TestBed } from '@angular/core/testing';

import { Sep10Service } from './sep-10.service';

describe('Sep10Service', () => {
  let service: Sep10Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sep10Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
