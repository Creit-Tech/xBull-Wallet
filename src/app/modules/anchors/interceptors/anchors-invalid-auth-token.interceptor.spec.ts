import { TestBed } from '@angular/core/testing';

import { AnchorsInvalidAuthTokenInterceptor } from './anchors-invalid-auth-token.interceptor';

describe('AnchorsInvalidAuthTokenInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      AnchorsInvalidAuthTokenInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: AnchorsInvalidAuthTokenInterceptor = TestBed.inject(AnchorsInvalidAuthTokenInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
