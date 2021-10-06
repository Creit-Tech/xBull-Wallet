import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import { GenerateAccountQuery } from '~root/modules/generate-account/state';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil, withLatestFrom } from 'rxjs/operators';
import { sameValueValidator } from '~root/shared/forms-validators/same-value.validator';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { WalletsQuery } from '~root/state';
import { Router } from '@angular/router';
import { ENV, environment } from '~env';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';

@Component({
  selector: 'app-confirm-phrase-password',
  templateUrl: './confirm-phrase-password.component.html',
  styleUrls: ['./confirm-phrase-password.component.scss']
})
export class ConfirmPhrasePasswordComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  wordList: string[] = this.mnemonicPhraseService.getWordList();
  filteredOptions: string[] = this.mnemonicPhraseService.getWordList();

  form: FormGroupTyped<IConfirmPhrasePasswordForm> = new FormGroup({
    words: new FormArray([]),
    searchInput: new FormControl(''),
    confirmPhrase: new FormControl(''),
    confirmPassword: new FormControl('', [Validators.required]),
  }) as unknown as FormGroupTyped<IConfirmPhrasePasswordForm>;

  get phraseArray(): FormArray {
    return this.form.controls.words as FormArray;
  }

  walletVersion = this.env.version;

  constructor(
    private readonly generateAccountQuery: GenerateAccountQuery,
    private readonly cryptoService: CryptoService,
    private readonly walletsService: WalletsService,
    private readonly walletsQuery: WalletsQuery,
    private readonly router: Router,
    @Inject(ENV) private readonly env: typeof environment,
    private mnemonicPhraseService: MnemonicPhraseService,
  ) { }

  wordsUpdatedSubscription: Subscription = this.phraseArray.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((words: string[]) => {
      const completePhrase = words
        .map(word => word.trim())
        .join(' ');

      this.form.controls.confirmPhrase.patchValue(completePhrase, { emitEvent: false });
    });

  checkPasswordWithGloablPassword: Subscription = this.form.controls.confirmPassword.valueChanges
    .pipe(withLatestFrom(this.walletsQuery.globalPasswordHash$))
    .pipe(filter(([_, globalPasswordHash]) => !!globalPasswordHash))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([value, globalPasswordHash]) => {
      const hashedPassword = this.cryptoService.hashPassword(value);

      if (hashedPassword !== globalPasswordHash) {
        this.form.controls.confirmPassword.setErrors({
          dontMatch: true
        }, { emitEvent: false });
      } else {
        this.form.controls.confirmPassword.setErrors(null);
      }
    });

  ngOnInit(): void {
    const generateAccountStorageSnapshot = this.generateAccountQuery.getValue();
    const accountsStoreSnapshot = this.walletsQuery.getValue();

    if (generateAccountStorageSnapshot.pathType === 'new_wallet' && generateAccountStorageSnapshot.mnemonicPhrase) {
      this.form.controls
        .confirmPhrase.setValidators([Validators.required, sameValueValidator(generateAccountStorageSnapshot.mnemonicPhrase)]);
    }

    if (!accountsStoreSnapshot.globalPasswordHash && generateAccountStorageSnapshot.password) {
      this.form.controls
        .confirmPassword.setValidators([Validators.required, sameValueValidator(generateAccountStorageSnapshot.password)]);
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onContinue(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    await this.walletsService.generateNewWallet({
      type: 'mnemonic_phrase',
      password: this.form.value.confirmPassword,
      mnemonicPhrase: this.form.value.confirmPhrase,
    });

    // TODO: filter if password is already saved
    this.walletsService.savePasswordHash(this.form.value.confirmPassword);

    await this.router.navigate(['/wallet', 'assets']);
  }

  addWord(word: string): void {
    if (!word || !this.wordList.find(w => w.includes(word))) {
      return;
    }

    this.phraseArray.push(
      new FormControl(word, Validators.required)
    );

    this.form.get('searchInput').patchValue('');
    this.filteredOptions = this.wordList;
  }

  removeWord(index: number): void {
    this.phraseArray.removeAt(index);
    this.filteredOptions = this.wordList;
  }

  filterOptions(value: string): void {
    this.filteredOptions = this.wordList.filter(option =>
      option.includes(value)
    );
  }

}

export interface IConfirmPhrasePasswordForm {
  searchInput: string;
  words: FormArray;
  confirmPhrase: string;
  confirmPassword: string;
}
