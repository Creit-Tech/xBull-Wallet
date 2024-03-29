import { Component } from '@angular/core';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { validPublicKeyValidator } from '~root/shared/forms-validators/valid-public-key.validator';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';
import { AirgappedWalletService } from '~root/core/services/airgapped-wallet/airgapped-wallet.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { AirGappedWalletProtocol, WalletType } from '~root/state';
import { Router } from '@angular/router';

@Component({
  selector: 'app-connect-air-gapped-wallet',
  templateUrl: './connect-air-gapped-wallet.component.html',
  styleUrls: ['./connect-air-gapped-wallet.component.scss']
})
export class ConnectAirGappedWalletComponent {
  accountsInputs: FormArray<FormControl<string | null>> = new FormArray<FormControl<string | null>>([
    new FormControl<string | null>('', [Validators.required, validPublicKeyValidator]),
  ]);

  constructor(
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
    private readonly airgappedWalletService: AirgappedWalletService,
    private readonly nzMessageService: NzMessageService,
    private readonly walletsService: WalletsService,
    private readonly router: Router,
  ) {}

  addNewAccount(): void {
    this.accountsInputs.push(
      new FormControl<string | null>('', [Validators.required, validPublicKeyValidator])
    );
  }

  removeAccount(i: number): void {
    this.accountsInputs.removeAt(i);
  }

  async scanQr(i: number): Promise<void> {
    try {
      const { address } = await this.airgappedWalletService.requestAddress({ path: `m/44'/148'/${i}'` });
      this.accountsInputs.at(i).patchValue(address);
    } catch (e: any) {
      this.nzMessageService.error(e.message, { nzDuration: 5000 });
    }
  }

  async confirm(): Promise<void> {
    if (!this.accountsInputs.value) {
      return;
    }

    const selectedAccounts: Array<{ publicKey: string; path: string }> = this.accountsInputs
      .value
      .map((item, i) => {
        if (!item) {
          this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
          throw new Error('Public key value is null');
        }

        return {
          path: `m/44'/148'/${i}'`,
          publicKey: item,
        };
      });

    if (selectedAccounts.length === 0) {
      this.nzMessageService.error('A wallet must have at least one address.');
      return;
    }

    await this.walletsService.generateNewWallet({
      type: WalletType.air_gapped,
      protocol: AirGappedWalletProtocol.LumenSigner,
      accounts: selectedAccounts,
    });

    this.nzMessageService.success(
      this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED')
    );
    await this.router.navigate(['/wallet', 'assets']);
  }
}
