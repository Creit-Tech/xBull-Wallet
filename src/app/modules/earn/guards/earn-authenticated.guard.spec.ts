import { TestBed } from '@angular/core/testing';

import { EarnAuthenticatedGuard } from './earn-authenticated.guard';

describe('EarnAuthenticatedGuard', () => {
  let guard: EarnAuthenticatedGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(EarnAuthenticatedGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
