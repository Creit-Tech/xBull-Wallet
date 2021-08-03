import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, merge, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { filter, map, pluck, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { Operation } from 'stellar-base';
import { WalletsAccountsQuery, WalletsAssetsQuery } from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SignPasswordComponent } from '~root/shared/modals/components/sign-password/sign-password.component';
import { ITransaction, WalletsService } from '~root/core/wallets/services/wallets.service';

@Component({
  selector: 'app-sign-xdr',
  templateUrl: './sign-xdr.component.html',
  styleUrls: ['./sign-xdr.component.scss']
})
export class SignXdrComponent implements OnInit, AfterViewInit {
  componentDestroyed$: Subject<void> = new Subject<void>();
  signing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  showModal = false;
  @Output() deny: EventEmitter<void> = new EventEmitter<void>();
  @Output() accept: EventEmitter<string> = new EventEmitter<string>();

  @Input() from: string | 'wallet' = 'wallet';

  xdr$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set xdr(data: string) {
    this.xdr$.next(data);
  }

  xdrParsed$: Observable<ITransaction> = this.xdr$.asObservable()
    .pipe(map(xdr =>
      this.walletsService.parseFromXDRToTransactionInterface(xdr)
    ));

  unhandledXdrCheckerSubscription: Subscription = this.xdrParsed$
    .pipe(take(1))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(xdr => {
      try {
        this.walletsService.checkIfAllOperationsAreHandled(xdr.operations);
      } catch (e) {
        this.toastrService.open({
          title: `Can't continue`,
          message: e.message,
          status: 'error',
        });
        this.onClose();
      }
    });

  // TODO: Handle this and a better way for the compiler understand the different types of operations
  operations$: Observable<Operation[]> = this.xdrParsed$
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

  memoText$: Observable<string> = this.xdrParsed$
    .pipe(filter<ITransaction>(data => !!data))
    .pipe(pluck<ITransaction, string>('memo'));


  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly cryptoService: CryptoService,
    private readonly walletsAccountQuery: WalletsAccountsQuery,
    private readonly toastrService: ToastrService,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly walletsService: WalletsService,
  ) { }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  ngOnInit(): void {
  }

  async onAccepted(): Promise<void> {
    // TODO: Check if we need to sign with password or with HW once we add it
    this.signWithPassword();
  }

  async signWithPassword(): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<SignPasswordComponent>(SignPasswordComponent);

    ref.component.instance.password
      .pipe(withLatestFrom(this.walletsAccountQuery.getSelectedAccount$))
      .pipe(take(1))
      .pipe(tap(() => {
        this.signing$.next(true);
      }))
      .pipe(map(([password, selectedAccount]) => {
        return this.cryptoService.decryptText(selectedAccount.secretKey, password);
      }))
      .pipe(withLatestFrom(this.xdr$))
      .pipe(map(([secret, xdr]) => {
        return this.stellarSdkService.signTransaction({ xdr, secret });
      }))
      .pipe(takeUntil(merge( this.componentDestroyed$, ref.destroyed$.asObservable() )))
      .subscribe(xdr => {
        this.signing$.next(false);
        this.accept.emit(xdr);
        ref.component.instance.onClose()
          .then(() => ref.close());
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

    ref.component.instance.cancel
      .pipe(take(1))
      .pipe(takeUntil(
        merge(
          this.componentDestroyed$,
          ref.destroyed$.asObservable()
        )
      ))
      .subscribe(() => {
        ref.close();
      });


    ref.open();
  }


  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.deny.emit();
  }

}
