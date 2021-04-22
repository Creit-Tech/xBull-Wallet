import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GenerateAccountQuery } from '~root/modules/generate-account/state';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountsService } from '~root/core/accounts/services/accounts.service';

@Component({
  selector: 'app-confirm-phrase-password',
  templateUrl: './confirm-phrase-password.component.html',
  styleUrls: ['./confirm-phrase-password.component.scss']
})
export class ConfirmPhrasePasswordComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  form: FormGroupTyped<IConfirmPhrasePasswordForm> = new FormGroup({
    phrase: new FormControl(this.generateAccountQuery.getValue().mnemonicPhrase, [Validators.required]),
    password: new FormControl(this.generateAccountQuery.getValue().password, [Validators.required]),
    confirmPhrase: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required]),
  }) as unknown as FormGroupTyped<IConfirmPhrasePasswordForm>;

  constructor(
    private readonly generateAccountQuery: GenerateAccountQuery,
    private readonly accountsService: AccountsService,
  ) { }

  formUpdatesSubscription: Subscription = this.form.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(value => {
      if (value.password !== value.confirmPassword) {
        this.form.controls.confirmPassword.setErrors({
          dontMatch: true
        }, { emitEvent: false });
      } else {
        this.form.controls.confirmPassword.setErrors(null, { emitEvent: false });
      }

      if (value.phrase !== value.confirmPhrase) {
        this.form.controls.confirmPhrase.setErrors({
          dontMatch: true
        });
      } else {
        this.form.controls.confirmPhrase.setErrors(null, { emitEvent: false });
      }
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onContinue(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const newAccountPublicKey = await this.accountsService.generateNewWallet({
      type: 'mnemonic_phrase',
      password: this.form.value.confirmPassword,
      mnemonicPhrase: this.form.value.confirmPhrase,
    });

    this.accountsService.savePasswordHash(this.form.value.confirmPassword);
  }

}

export interface IConfirmPhrasePasswordForm {
  phrase: string;
  password: string;
  confirmPhrase: string;
  confirmPassword: string;
}
