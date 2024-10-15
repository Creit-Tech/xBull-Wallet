import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { GenerateAccountQuery } from '~root/modules/generate-account/state';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { SettingsQuery, WalletsQuery, WalletType } from '~root/state';
import { Router } from '@angular/router';
import { ENV, environment } from '~env';
import { filter, takeUntil, withLatestFrom } from 'rxjs/operators';
import { sameValueValidator } from '~root/shared/forms-validators/same-value.validator';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-secret-password',
  templateUrl: './confirm-secret-password.component.html',
  styleUrls: ['./confirm-secret-password.component.scss']
})
export class ConfirmSecretPasswordComponent implements OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  form: UntypedFormGroup = new UntypedFormGroup({
    secretKey: new UntypedFormControl('', [Validators.required]),
    confirmPassword: new UntypedFormControl('', [Validators.required, Validators.min(8)]),
  });

  walletVersion = this.env.version;

  constructor(
    private readonly generateAccountQuery: GenerateAccountQuery,
    private readonly cryptoService: CryptoService,
    private readonly walletsService: WalletsService,
    private readonly walletsQuery: WalletsQuery,
    private readonly router: Router,
    @Inject(ENV) private readonly env: typeof environment,
    private readonly nzMessageService: NzMessageService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    const generateAccountStorageSnapshot = this.generateAccountQuery.getValue();
    const accountsStoreSnapshot = this.walletsQuery.getValue();

    // DO NOT USE THIS UNLESS YOU REALLY KNOW WHAT YOU ARE DOING
    const testPassword = 'thisisatestpasswordandyoushouldnotuseit';

    if (generateAccountStorageSnapshot.password === testPassword) {
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

    if (!this.walletsService.validatePassword(this.form.value.confirmPassword)) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.PASSWORD_INCORRECT'));
      return;
    }

    await this.walletsService.generateNewWallet({
      type: WalletType.secret_key,
      password: this.form.value.confirmPassword,
      secretKey: this.form.value.secretKey,
    });

    if (!this.walletsQuery.getValue().passwordSet) {
      this.walletsService.updatePasswordIsSet();
    }

    await this.router.navigate(['/wallet', 'assets']);
  }


}


export interface IConfirmSecretPasswordForm {
  secretKey: string;
  confirmPassword: string;
}
