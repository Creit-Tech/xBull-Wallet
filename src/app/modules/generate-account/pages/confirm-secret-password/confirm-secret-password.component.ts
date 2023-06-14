import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { GenerateAccountQuery } from '~root/modules/generate-account/state';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { WalletsQuery, WalletType } from '~root/state';
import { Router } from '@angular/router';
import { ENV, environment } from '~env';
import { filter, takeUntil, withLatestFrom } from 'rxjs/operators';
import { sameValueValidator } from '~root/shared/forms-validators/same-value.validator';

@Component({
  selector: 'app-confirm-secret-password',
  templateUrl: './confirm-secret-password.component.html',
  styleUrls: ['./confirm-secret-password.component.scss']
})
export class ConfirmSecretPasswordComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  form: UntypedFormGroup = new UntypedFormGroup({
    secretKey: new UntypedFormControl('', [Validators.required]),
    confirmPassword: new UntypedFormControl('', [Validators.required]),
  });

  walletVersion = this.env.version;

  constructor(
    private readonly generateAccountQuery: GenerateAccountQuery,
    private readonly cryptoService: CryptoService,
    private readonly walletsService: WalletsService,
    private readonly walletsQuery: WalletsQuery,
    private readonly router: Router,
    @Inject(ENV) private readonly env: typeof environment,
  ) { }

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

    // DO NOT USE THIS UNLESS YOU REALLY KNOW WHAT YOU ARE DOING
    const testPassword = 'thisisatestpasswordandyoushouldnotuseit';

    if (generateAccountStorageSnapshot.password !== testPassword) {
      if (!accountsStoreSnapshot.globalPasswordHash && generateAccountStorageSnapshot.password) {
        this.form.controls
          .confirmPassword.setValidators([Validators.required, sameValueValidator(generateAccountStorageSnapshot.password)]);
      }
    } else {
      this.form.controls.secretKey.patchValue('SCPA5OX4EYINOPAUEQCPY6TJMYICUS5M7TVXYKWXR3G5ZRAJXY3C37GF');
      this.form.controls.confirmPassword.patchValue(testPassword);
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
      type: WalletType.secret_key,
      password: this.form.value.confirmPassword,
      secretKey: this.form.value.secretKey,
    });

    // TODO: filter if password is already saved
    this.walletsService.savePasswordHash(this.form.value.confirmPassword);

    await this.router.navigate(['/wallet', 'assets']);
  }


}


export interface IConfirmSecretPasswordForm {
  secretKey: string;
  confirmPassword: string;
}
