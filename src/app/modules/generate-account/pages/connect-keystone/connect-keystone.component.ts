import { Component, TemplateRef, ViewChild } from '@angular/core';
import { IScannerControls } from '@zxing/browser';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { AirGappedWalletProtocol, WalletType } from '~root/state';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { AirgappedWalletService } from '~root/core/services/airgapped-wallet/airgapped-wallet.service';

@Component({
  selector: 'app-connect-keystone',
  templateUrl: './connect-keystone.component.html',
  styleUrl: './connect-keystone.component.scss'
})
export class ConnectKeystoneComponent {
  @ViewChild('videoTemplate', { read: TemplateRef })
  videoTemplateRef?: TemplateRef<any>;

  constructor(
    private readonly nzModalService: NzModalService,
    private readonly nzMessageService: NzMessageService,
    private readonly translateService: TranslateService,
    private readonly router: Router,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsService: WalletsService,
    private readonly airgappedWalletService: AirgappedWalletService,
  ) {}

  async scanQr(): Promise<void> {
    if (!this.videoTemplateRef) {
      alert('videoTemplateRef doesn\'t exist, contact support.');
      return;
    }

    let scannerControls: IScannerControls;
    const progress$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    const modal = this.nzModalService.create({
      nzData: { progress$ },
      nzContent: this.videoTemplateRef,
      nzTitle: 'Scan QR',
      nzOkText: null,
      nzCancelDisabled: true,
      nzOnCancel: () => scannerControls.stop(),
      nzClosable: false,
      nzMaskClosable: false,
    });

    await firstValueFrom(modal.afterOpen);

    scannerControls = await this.airgappedWalletService.scanKeystoneAccounts({
      videoElId: 'connectVideoElement',
      onProgress: (progress: number) => progress$.next(progress),
      onSucceed: async (result): Promise<void> => {
        scannerControls.stop();
        modal.close();

        const selectedAccounts: Array<{ publicKey: string; path: string }> = result.accounts.keys.map(acc => {
          return {
            path: acc.path,
            publicKey: this.stellarSdkService.SDK.StrKey.encodeEd25519PublicKey(Buffer.from(acc.publicKey, 'hex')),
          };
        });

        await this.walletsService.generateNewWallet({
          type: WalletType.air_gapped,
          protocol: AirGappedWalletProtocol.KeyStone,
          deviceId: result.accounts.masterFingerprint,
          accounts: selectedAccounts,
        });

        this.nzMessageService.success(
          this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED')
        );
        await this.router.navigate(['/wallet', 'assets']);
      },
      onError: (err: Error) => {
        console.error(err);
        scannerControls.stop();
        modal.close();
        this.nzMessageService.error(this.translateService.instant(err.message));
      },
    });

    modal.updateConfig({ nzCancelDisabled: false });
  }
}
