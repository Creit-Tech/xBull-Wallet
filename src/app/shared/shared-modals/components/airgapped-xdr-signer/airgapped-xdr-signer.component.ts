import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
  timer
} from 'rxjs';
import { map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import QRCode from 'qrcode';
import { FormControl } from '@angular/forms';
import { QrScanModalComponent } from '~root/shared/shared-modals/components/qr-scan-modal/qr-scan-modal.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { AirgappedWalletService } from '~root/core/services/airgapped-wallet/airgapped-wallet.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-airgapped-xdr-signer',
  templateUrl: './airgapped-xdr-signer.component.html',
  styleUrls: ['./airgapped-xdr-signer.component.scss']
})
export class AirgappedXdrSignerComponent implements AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  currentIndex$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  autoChangeControl: FormControl<boolean | null> = new FormControl<boolean | null>(false);

  xdr$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set xdr(data: string) {
    this.xdr$.next(data);
  }

  path$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set path(data: string) {
    this.path$.next(data);
  }

  network$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set network(data: string) {
    this.network$.next(data);
  }

  @Input() signatureResultHandler!: (signature: string) => void;

  signRequestImages$: Observable<string[]> = combineLatest([
    this.xdr$.asObservable(),
    this.path$.asObservable(),
    this.network$.asObservable(),
  ])
    .pipe(switchMap(([xdr, path, network]) => {
      const chunksXDR = xdr.match(/.{1,50}/g);
      if (!chunksXDR) {
        throw new Error('');
      }

      chunksXDR[0] = `${path};${chunksXDR[0]}`;
      chunksXDR[chunksXDR.length - 1] = `${chunksXDR[chunksXDR.length - 1]};${network}`;

      const formattedChunks: string[] = chunksXDR
        .map((item, i) => {
          return `p${i + 1}of${chunksXDR.length};sign-transaction;${item}`;
        });

      return Promise.all(formattedChunks.map(chunk => QRCode.toDataURL(chunk, {  })));
    }));

  constructor(
    private readonly nzDrawerService: NzDrawerService,
    private readonly airgappedWalletService: AirgappedWalletService,
    private readonly nzMessageService: NzMessageService,
  ) {}

  autoUpdateIndexSubscription: Subscription = this.autoChangeControl.valueChanges
    .pipe(switchMap(value => {
      if (value) {
        return timer(0, 500)
          .pipe(map(_ => {
            this.updateCurrentIndex('up').then();
          }));
      } else {
        return of(null);
      }
    }))
    .pipe(withLatestFrom(this.componentDestroyed$.asObservable()))
    .subscribe();

  ngAfterViewInit(): void {
    setTimeout(() => this.autoChangeControl.setValue(true), 300);
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async updateCurrentIndex(action: 'up' | 'down'): Promise<void> {
    const currentIndex = this.currentIndex$.getValue();
    const signRequestImages = await firstValueFrom(this.signRequestImages$);

    if (action === 'up') {
      if (signRequestImages.length - 1 > currentIndex) {
        this.currentIndex$.next(currentIndex + 1);
      } else {
        this.currentIndex$.next(0);
      }
    } else {
      if (currentIndex > 0) {
        this.currentIndex$.next(currentIndex - 1);
      } else {
        this.currentIndex$.next(signRequestImages.length - 1);
      }
    }
  }

  async scanSignedTransaction(): Promise<void> {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: 'Scan QR',
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: text => {
          try {
            const transactionResult = this.airgappedWalletService.decodeSignature(text);
            this.signatureResultHandler(transactionResult);
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
