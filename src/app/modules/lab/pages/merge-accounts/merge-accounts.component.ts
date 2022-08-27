import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, from, Subject, Subscription } from 'rxjs';
import QrScanner from 'qr-scanner';
import { ENV, environment } from '~env';
import { WalletsAccountsQuery } from '~root/state';
import { map, take, takeUntil } from 'rxjs/operators';
import { QrScanModalComponent } from '~root/shared/modals/components/qr-scan-modal/qr-scan-modal.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AccountResponse } from 'stellar-sdk';

@Component({
  selector: 'app-merge-accounts',
  templateUrl: './merge-accounts.component.html',
  styleUrls: ['./merge-accounts.component.scss']
})
export class MergeAccountsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  isMobilePlatform = this.env.platform === 'mobile';
  hasCamera = from(QrScanner.hasCamera());

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  selectedAccountCanBeMerged$ = this.selectedAccount$
    .pipe(map(selectedAccount =>
      selectedAccount?.accountRecord?.subentry_count === 0
    ));

  form: FormGroup<IMergeAccountForm> = new FormGroup<IMergeAccountForm>({
    destination: new FormControl<string>('', [Validators.required]),
    memo: new FormControl<string>(''),
  });

  confirm$: Subject<void> = new Subject<void>();
  confirmDisabled$ = new BehaviorSubject(false);
  onConfirmSubscription: Subscription = this.confirm$.asObservable()
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(_ => {
      this.confirmDisabled$.next(true);
      this.confirm()
        .then(() => this.confirmDisabled$.next(false))
        .catch(() => this.confirmDisabled$.next(false));
    });

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translateService: TranslateService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalService: NzModalService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  scanPublicKey(): void {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.SCAN_PUBLIC_KEY_TITLE'),
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: text => {
          this.form.controls.destination.patchValue(text);
          drawerRef.close();
          this.cdr.detectChanges();
        }
      }
    });

    drawerRef.open();
  }

  scanMemoText(): void {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.SCAN_MEMO_TITLE'),
      nzHeight: '100%',
      nzWrapClassName: 'ios-safe-y',
      nzContentParams: {
        handleQrScanned: text => {
          this.form.controls.memo.patchValue(text);
          drawerRef.close();
          this.cdr.detectChanges();
        }
      }
    });

    drawerRef.open();
  }

  async confirm(): Promise<void> {
    const selectedAccount = await this.selectedAccount$
      .pipe(take(1))
      .toPromise();

    if (
      !selectedAccount ||
      !this.form.value.destination
    ) { return; }

    let loadedAccount: AccountResponse;
    try {
      loadedAccount = await this.stellarSdkService
        .Server
        .loadAccount(selectedAccount.publicKey);
    } catch (e) {
      this.nzMessageService.error(
        this.translateService.instant('ERROR_MESSAGES.YOUR_ACCOUNT_NOT_CREATED')
      );
      return;
    }

    const sourceAccount = new this.stellarSdkService.SDK.Account(loadedAccount.accountId(), loadedAccount.sequence);

    const transactionBuilder = new this.stellarSdkService.SDK.TransactionBuilder(sourceAccount, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    }).setTimeout(this.stellarSdkService.defaultTimeout);

    try {
      await this.stellarSdkService.loadAccount(this.form.value.destination);
    } catch (e) {
      this.nzMessageService.error(`Destination account does not exist.`);
      return;
    }

    transactionBuilder.addOperation(
      this.stellarSdkService.SDK.Operation.accountMerge({
        destination: this.form.value.destination
      })
    );

    if (!!this.form.value.memo) {
      transactionBuilder.addMemo(
        new this.stellarSdkService.SDK.Memo('text', this.form.value.memo)
      );
    }

    const transaction = transactionBuilder
      .build();

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzTitle: this.translateService.instant('LAB.MERGE_ACCOUNT'),
      nzContentParams: {
        xdr: transaction.toXDR(),
        signingResultsHandler: data => {
          const messageId = this.nzMessageService
            .loading('loading...', { nzDuration: 0 })
            .messageId;

          this.stellarSdkService.Server.submitTransaction(data.transaction)
            .then(_ => {
              this.nzMessageService.remove(messageId);
              this.nzMessageService.success(
                this.translateService.instant('LAB.MERGE_ACCOUNT_COMPLETED')
              );
              this.form.reset();
            })
            .catch(err => {
              this.nzMessageService.remove(messageId);
              this.nzModalService.error({
                nzTitle: 'Oh oh!',
                nzContent: this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'),
              });
            });
        }
      }
    });

    drawerRef.open();
  }

}

interface IMergeAccountForm {
  destination: FormControl<string | null>;
  memo: FormControl<string | null>;
}
