import { TestBed } from '@angular/core/testing';

import { CanAccessConnectGuard } from './can-access-connect.guard';

describe('CanAccessConnectGuard', () => {
  let guard: CanAccessConnectGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(CanAccessConnectGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
