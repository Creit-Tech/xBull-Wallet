import { TestBed } from '@angular/core/testing';

import { MnemonicPhraseService } from './mnemonic-phrase.service';

describe('MnemonicPhraseService', () => {
  let service: MnemonicPhraseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MnemonicPhraseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
