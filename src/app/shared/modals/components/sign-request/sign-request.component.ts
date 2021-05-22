import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, from, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { WalletsAccountsQuery, WalletsAssetsQuery, WalletsQuery } from '~root/core/wallets/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import BigNumber from 'bignumber.js';
import { filter, map, pluck, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { PasswordFormComponent } from '~root/shared/modals/components/password-form/password-form.component';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { ITransaction, WalletsOperationsService } from '~root/core/wallets/services/wallets-operations.service';

@Component({
  selector: 'app-sign-request',
  templateUrl: './sign-request.component.html',
  styleUrls: ['./sign-request.component.scss']
})
export class SignRequestComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  signing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  @Input() from: string | 'wallet' = 'wallet';

  xdr$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set xdr(data: string) {
    this.xdr$.next(data);
  }

  @Output() deny: EventEmitter<void> = new EventEmitter<void>();
  @Output() accepted: EventEmitter<string> = new EventEmitter<string>();

  xdrParsed$: Observable<ITransaction> = this.xdr$.asObservable()
    .pipe(map(xdr =>
      this.walletsOperationsService.parseFromXDRToTransactionInterface(xdr)
    ));

  // This is actually IOperation[] but I used "any" so the compiler stops complaining
  // TODO: Handle this and a better way for the compiler understand the different types of operations
  operations$: Observable<any> = this.xdrParsed$
    .pipe(map(xdrParse => xdrParse?.operations || []));

  // TODO: Make this dynamic with a config store
  fee$: Observable<string> = this.xdrParsed$
    .pipe(filter<ITransaction>(data => !!data))
    .pipe(pluck<ITransaction, string>('fee'))
    .pipe(map(fee =>
      new BigNumber(fee)
        .dividedBy('10000000')
        .toString()
    ));

  selectedAccount$ = this.walletsAccountQuery.getSelectedAccount$;

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly modalsService: ModalsService,
    private readonly cryptoService: CryptoService,
    private readonly walletsAccountQuery: WalletsAccountsQuery,
    private readonly toastrService: ToastrService,
    private readonly walletsOperationsService: WalletsOperationsService,
  ) { }

  passwordProvided$: Subject<string> = new Subject<string>();
  signWithPasswordSubscription: Subscription = this.passwordProvided$
    .asObservable()
    .pipe(tap(() => this.signing$.next(true)))
    .pipe(withLatestFrom(this.selectedAccount$))
    .pipe(map(([password, selectedAccount]) => {
      return this.cryptoService.decryptText(selectedAccount.secretKey, password);
    }))
    .pipe(withLatestFrom(this.xdr$))
    .pipe(map(([secret, xdr]) =>
      this.stellarSdkService.signTransaction({
        xdr,
        secret
      })
    ))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(xdr => {
      this.signing$.next(false);
      this.accepted.emit(xdr);
    }, error => {
      console.log(error);
      this.toastrService.open({
        title: 'Error',
        status: 'error',
        message: `We couldn't sign the transaction, please check your password is correct`,
      });

      this.signing$.next(false);
      this.deny.emit();
    });

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onAccepted(): Promise<void> {
    const modalData = await this.modalsService.open<PasswordFormComponent>({ component: PasswordFormComponent });

    modalData.componentRef.instance.password
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(password => {
        this.passwordProvided$.next(password);
        modalData.modalContainer.instance.onClose();
      });
  }

  onDenied(): void {
    this.deny.emit();
  }

}
