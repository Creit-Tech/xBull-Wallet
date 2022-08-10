import { TestBed } from '@angular/core/testing';

import { EarnInvalidTokenInterceptor } from './earn-invalid-token.interceptor';

describe('EarnInvalidTokenInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      EarnInvalidTokenInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: EarnInvalidTokenInterceptor = TestBed.inject(EarnInvalidTokenInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
