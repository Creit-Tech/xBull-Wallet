import {Inject, Injectable, Renderer2, RendererFactory2} from '@angular/core';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
import {DOCUMENT} from '@angular/common';
import {NzDrawerService} from 'ng-zorro-antd/drawer';
import {take, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {CloseScanComponent} from '~root/mobile/components/close-scan/close-scan.component';

@Injectable()
export class QrScannerService {
  renderer2: Renderer2;
  qrScanned$: Subject<void> = new Subject<void>();
  closeEvent$: Subject<void> = new Subject<void>();


  constructor(
    private qrScanner: QRScanner,
    private readonly rendererFactory2: RendererFactory2,
    @Inject(DOCUMENT)
    private document: Document,
    private readonly nzDrawerService: NzDrawerService,
  ) {
    this.renderer2 = rendererFactory2.createRenderer(null, null);
  }

  prepare(): Promise<QRScannerStatus> {
    return this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          return status;
        } else if (status.denied) {
          throw new Error('Camera permission was not provided, you need to go to your settings and allow it.');
        } else {
          throw new Error('Camera permission was not provided');
        }
      });
  }

  openScanner(): Promise<void> {
    return this.qrScanner.show()
      .then(() => {
        this.renderer2.addClass(this.document.body, 'hide-app-send-funds');
        this.renderer2.removeClass(this.document.body, 'bg-off-black');
        return;
      });
  }

  closeScanner(): Promise<QRScannerStatus | void> {
    return this.qrScanner.hide()
      .then(() => this.qrScanner.destroy())
      .then(() => {
        this.renderer2.removeClass(this.document.body, 'hide-app-send-funds');
        this.renderer2.addClass(this.document.body, 'bg-off-black');
        return;
      });
  }

  async scan(): Promise<{ completed: boolean; text?: string }> {
    await this.openScanner();

    const drawerRef = this.nzDrawerService.create<CloseScanComponent>({
      nzPlacement: 'bottom',
      nzClosable: false,
      nzCloseOnNavigation: false,
      nzMaskClosable: false,
      nzHeight: 90,
      nzContent: CloseScanComponent,
      nzContentParams: {},
      nzWrapClassName: 'ios-safe-y'
    });

    drawerRef.open();

    return new Promise((resolve, reject) => {
      this.closeEvent$
        .asObservable()
        .pipe(take(1))
        .pipe(takeUntil(this.qrScanned$))
        .subscribe(() => {
          resolve({ completed: false });
          drawerRef.close();

          this.closeScanner()
            .then(() => scanSub.unsubscribe());
        });

      const scanSub = this.qrScanner.scan()
        .pipe(take(1))
        .pipe(takeUntil(this.closeEvent$))
        .subscribe((text: string) => {
          resolve({ completed: true, text });
          this.qrScanned$.next();

          drawerRef.close();


          this.closeScanner()
            .then(() => scanSub.unsubscribe());
        }, err => {
          drawerRef.close();
          this.closeScanner()
            .then(() => scanSub.unsubscribe());
          reject(err);
        });
    });
  }
}
