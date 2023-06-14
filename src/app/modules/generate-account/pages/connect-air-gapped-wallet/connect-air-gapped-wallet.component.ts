import { Component } from '@angular/core';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { validPublicKeyValidator } from '~root/shared/forms-validators/valid-public-key.validator';
import { QrScanModalComponent } from '~root/shared/shared-modals/components/qr-scan-modal/qr-scan-modal.component';
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

  scanQr(i: number): void {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: 'Scan QR',
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: text => {
          try {
            const addressResult = this.airgappedWalletService.decodeAddress(text);
            const expectedPath = `m/44'/148'/${i}'`;
            if (addressResult.path !== expectedPath) {
              throw new Error(`Path ${addressResult.path} is invalid, path ${expectedPath} expected.`);
            }
            this.accountsInputs.at(i).patchValue(addressResult.publicKey);
          } catch (e: any) {
            this.nzMessageService.error(e.message, { nzDuration: 5000 });
          }
          drawerRef.close();
        }
      }
    });

    drawerRef.open();
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
