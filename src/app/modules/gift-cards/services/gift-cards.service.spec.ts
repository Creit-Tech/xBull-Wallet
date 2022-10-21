import { TestBed } from '@angular/core/testing';

import { GiftCardsService } from './gift-cards.service';

describe('GiftCardsService', () => {
  let service: GiftCardsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GiftCardsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
