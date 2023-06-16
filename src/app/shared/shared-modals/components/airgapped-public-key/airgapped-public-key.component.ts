import { Component, Input } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import QRCode from 'qrcode';
import { switchMap, take } from 'rxjs/operators';
import { QrScanModalComponent } from '~root/shared/shared-modals/components/qr-scan-modal/qr-scan-modal.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { AirgappedWalletService } from '~root/core/services/airgapped-wallet/airgapped-wallet.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-airgapped-public-key',
  templateUrl: './airgapped-public-key.component.html',
  styleUrls: ['./airgapped-public-key.component.scss']
})
export class AirgappedPublicKeyComponent {
  path$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set path(data: string) {
    this.path$.next(data);
  }

  @Input() requestResultHandler!: (address: string) => void;

  image$: Observable<string> = this.path$.asObservable()
    .pipe(switchMap(path => {
      return QRCode.toDataURL(`request-address;${path}`);
    }));

  constructor(
    private readonly nzDrawerService: NzDrawerService,
    private readonly airgappedWalletService: AirgappedWalletService,
    private readonly nzMessageService: NzMessageService,
  ) {}

  async scanPublicKey(): Promise<void> {
    const expectedPath = await this.path$
      .asObservable()
      .pipe(take(1))
      .toPromise();

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
            if (addressResult.path !== expectedPath) {
              throw new Error(`Path ${addressResult.path} is invalid, path ${expectedPath} expected.`);
            }
            const transactionResult = this.airgappedWalletService.decodeAddress(text);
            this.requestResultHandler(transactionResult.publicKey);
          } catch (e: any) {
            this.nzMessageService.error(e.message, { nzDuration: 5000 });
          }
          drawerRef.close();
        }
      }
    });

    drawerRef.open();
  }

}
