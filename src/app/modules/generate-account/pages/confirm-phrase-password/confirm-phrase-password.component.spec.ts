import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { ENV } from '~env';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { GenerateAccountQuery } from '~root/modules/generate-account/state';
import { WalletsQuery } from '~root/state';
import { ConfirmPhrasePasswordComponent } from './confirm-phrase-password.component';

describe('ConfirmPhrasePasswordComponent', () => {
  let component: ConfirmPhrasePasswordComponent;
  let fixture: ComponentFixture<ConfirmPhrasePasswordComponent>;

  const mockWordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'];

  const mockMnemonicPhraseService = {
    getWordList: () => mockWordList,
    validateMnemonicPhrase: (phrase: string) => true,
    getTestAccount: () => ['abandon', 'ability'],
  };

  const mockGenerateAccountQuery = {
    getValue: () => ({ pathType: 'new_wallet', password: 'test', mnemonicPhrase: 'abandon ability' }),
  };

  const mockWalletsQuery = {
    getValue: () => ({ passwordSet: true }),
  };

  const mockWalletsService = {
    validatePassword: () => true,
    generateNewWallet: jasmine.createSpy('generateNewWallet'),
    updatePasswordIsSet: jasmine.createSpy('updatePasswordIsSet'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmPhrasePasswordComponent ],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
        NzMessageModule,
      ],
      providers: [
        { provide: MnemonicPhraseService, useValue: mockMnemonicPhraseService },
        { provide: GenerateAccountQuery, useValue: mockGenerateAccountQuery },
        { provide: WalletsQuery, useValue: mockWalletsQuery },
        { provide: WalletsService, useValue: mockWalletsService },
        { provide: CryptoService, useValue: {} },
        { provide: ENV, useValue: { version: '1.0.0' } },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPhrasePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should allow adding a single word and normalize to lowercase', () => {
    component.addWord('ABANDON');
    expect(component.phraseArray.length).toBe(1);
    expect(component.phraseArray.at(0).value).toBe('abandon');
  });

  it('should allow pasting an entire mnemonic phrase at once', () => {
    const fullPhrase = 'abandon ability able about';
    component.addWord(fullPhrase);
    expect(component.phraseArray.length).toBe(4);
    expect(component.phraseArray.at(0).value).toBe('abandon');
    expect(component.phraseArray.at(1).value).toBe('ability');
    expect(component.phraseArray.at(2).value).toBe('able');
    expect(component.phraseArray.at(3).value).toBe('about');
  });

  it('should handle clipboard paste event with multiple words', () => {
    const fakeClipboardEvent = {
      clipboardData: {
        getData: (type: string) => 'above absent absorb',
      },
      preventDefault: jasmine.createSpy('preventDefault'),
    } as unknown as ClipboardEvent;

    component.handlePaste(fakeClipboardEvent);
    expect((fakeClipboardEvent.preventDefault as jasmine.Spy)).toHaveBeenCalled();
    expect(component.phraseArray.length).toBe(3);
    expect(component.phraseArray.at(0).value).toBe('above');
    expect(component.phraseArray.at(1).value).toBe('absent');
    expect(component.phraseArray.at(2).value).toBe('absorb');
  });
});