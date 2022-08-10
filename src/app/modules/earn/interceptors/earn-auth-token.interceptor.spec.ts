import { TestBed } from '@angular/core/testing';

import { EarnAuthTokenInterceptor } from './earn-auth-token.interceptor';

describe('EarnAuthTokenInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      EarnAuthTokenInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: EarnAuthTokenInterceptor = TestBed.inject(EarnAuthTokenInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
