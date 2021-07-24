import { TestBed } from '@angular/core/testing';

import { CanCreatePasswordGuard } from './can-create-password.guard';

describe('CanCreatePasswordGuard', () => {
  let guard: CanCreatePasswordGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(CanCreatePasswordGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
