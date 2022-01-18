import { TestBed } from '@angular/core/testing';

import { IosViewRestrictionGuard } from './ios-view-restriction.guard';

describe('IosTradeRestrictionGuard', () => {
  let guard: IosViewRestrictionGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(IosViewRestrictionGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
