import { TestBed } from '@angular/core/testing';

import { IsThereWalletsGuard } from './is-there-wallets.guard';

describe('IsThereWalletsGuard', () => {
  let guard: IsThereWalletsGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(IsThereWalletsGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
