import { TestBed } from '@angular/core/testing';

import { Sep24Service } from './sep24.service';

describe('Sep24Service', () => {
  let service: Sep24Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sep24Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
