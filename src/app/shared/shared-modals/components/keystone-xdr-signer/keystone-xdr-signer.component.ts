import { Component, Inject, TemplateRef, ViewChild } from '@angular/core';
import { FeeBumpTransaction, Transaction } from 'stellar-sdk';
import { NZ_MODAL_DATA, NzModalService } from 'ng-zorro-antd/modal';
import KeystoneSDK, { KeystoneStellarSDK, UR, UREncoder } from '@keystonehq/keystone-sdk';
import { BehaviorSubject, firstValueFrom, from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import QRCode from 'qrcode';
import { IScannerControls } from '@zxing/browser';
import { AirgappedWalletService } from '~root/core/services/airgapped-wallet/airgapped-wallet.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';

const MAX_FRAGMENT_LENGTH = 400;
const DEFAULT_INTERVAL = 100;

@Component({
  selector: 'app-keystone-xdr-signer',
  templateUrl: './keystone-xdr-signer.component.html',
  styleUrl: './keystone-xdr-signer.component.scss'
})
export class KeystoneXdrSignerComponent {
  @ViewChild('videoTemplate', { read: TemplateRef })
  videoTemplateRef?: TemplateRef<any>;

  qrDataUrl$: Observable<string> = of(this.data)
    .pipe(
      map(({ path, tx }) => {
        const stellarTransactionHash = {
          requestId: crypto.randomUUID(),
          signData: tx.hash().toString('hex'),
          dataType: KeystoneStellarSDK.DataType.TransactionHash,
          path,
          xfp: this.data.deviceId,
          origin: `xbull wallet`
        };
        const keystoneSDK = new KeystoneSDK();
        const { cbor, type } = keystoneSDK.stellar.generateSignRequest(stellarTransactionHash);
        return new UREncoder(new UR(cbor, type), MAX_FRAGMENT_LENGTH);
      }),
      switchMap((urEncoder: UREncoder): Observable<string> => {
        // If in the future we decide to use non hash signing, remove this line and uncomment the other one.
        return from(QRCode.toDataURL(urEncoder.nextPart().toUpperCase(), { margin: 4 }));
        // return timer(0, DEFAULT_INTERVAL)
        //   .pipe(switchMap(() => {
        //     return QRCode.toDataURL(urEncoder.nextPart().toUpperCase(), { margin: 4 });
        //   }));
      }),
    );

  hash: string = this.data.tx.hash().toString('hex');

  constructor(
    @Inject(NZ_MODAL_DATA)
    public readonly data: {
      tx: Transaction | FeeBumpTransaction;
      path: string;
      deviceId: string;
      signatureResultHandler: (signature: string) => void;
    },
    private readonly nzModalService: NzModalService,
    private readonly airgappedWalletService: AirgappedWalletService,
    private readonly nzMessageService: NzMessageService,
    private readonly translateService: TranslateService,
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

    scannerControls = await this.airgappedWalletService.scanKeyStoneSignature({
      videoElId: 'connectVideoElement',
      onProgress: (progress: number) => progress$.next(progress),
      onSucceed: async (result): Promise<void> => {
        scannerControls.stop();
        modal.close();
        this.data.signatureResultHandler(result.signature);
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
