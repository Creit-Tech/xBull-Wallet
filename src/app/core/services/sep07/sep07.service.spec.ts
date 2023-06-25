import { TestBed } from '@angular/core/testing';

import { Sep07Service } from './sep07.service';

describe('Sep07Service', () => {
  let service: Sep07Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sep07Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
