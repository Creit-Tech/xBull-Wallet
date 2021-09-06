import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, merge, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { filter, map, pluck, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { Operation } from 'stellar-base';
import { IWalletsAccountLedger, IWalletsAccountWithSecretKey, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SignPasswordComponent } from '~root/shared/modals/components/sign-password/sign-password.component';
import { ITransaction, WalletsService } from '~root/core/wallets/services/wallets.service';
import { HardwareWalletsService } from '~root/core/services/hardware-wallets.service';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

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
    private readonly hardwareWalletsService: HardwareWalletsService,
  ) { }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  ngOnInit(): void {
  }

  async onAccepted(): Promise<void> {
    const selectedAccount = await this.walletsAccountQuery.getSelectedAccount$.pipe(take(1)).toPromise();

    if (!selectedAccount) {
      // TODO: Handle this case
      return;
    }

    switch (selectedAccount.type) {
      case 'with_secret_key':
        await this.signWithPassword(selectedAccount);
        break;

      case 'with_ledger_wallet':
        await this.signWithLedger(selectedAccount);
        break;
    }

  }

  async signWithPassword(selectedAccount: IWalletsAccountWithSecretKey): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<SignPasswordComponent>(SignPasswordComponent);

    ref.component.instance.password
      .pipe(take(1))
      .pipe(tap(() => {
        this.signing$.next(true);
      }))
      .pipe(map((password) => {
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

  async signWithLedger(selectedAccount: IWalletsAccountLedger): Promise<void> {
    this.signing$.next(true);
    const xdr = await this.xdr$.pipe(take(1)).toPromise();
    let transport: TransportWebUSB;
    let targetDevice: USBDevice | undefined;

    try {
      const connectedDevices = await this.hardwareWalletsService.getConnectedLedgers();
      targetDevice = connectedDevices.find(device => this.walletsService.generateLedgerWalletId(device) === selectedAccount.walletId);

      if (!targetDevice) {
        throw new Error('Target not found');
      }
    } catch (e) {
      console.error(e);
      this.toastrService.open({
        title: `Device not found`,
        message: `We didn't find the correct device connected, please make sure you are using the correct device.`,
        status: 'error',
        timer: 5000,
      });
      this.signing$.next(false);
      return;
    }

    try {
      transport = await this.hardwareWalletsService.openLedgerConnection(targetDevice);
    } catch (e) {
      this.signing$.next(false);
      this.toastrService.open({
        title: `Can't connect`,
        message: `Please make sure your wallet is unlocked and using the Stellar App.`,
        status: 'error',
        timer: 5000,
      });
      return;
    }

    try {
      this.toastrService.open({
        title: `Check your wallet`,
        message: `Please confirm or cancel the transaction in your device.`,
        status: 'info',
        timer: 5000,
      });
      const signedXDR = await this.hardwareWalletsService.signWithLedger({
        xdr,
        accountPath: selectedAccount.path,
        publicKey: selectedAccount.publicKey,
        transport,
      });

      this.signing$.next(false);
      this.accept.emit(signedXDR);
    } catch (e) {
      this.signing$.next(false);
      this.toastrService.open({
        title: `Can't connect/sign`,
        message: `Please make sure your wallet is unlocked and using the Stellar App. This error also happens when your wallet does not support this kind of operation`,
        status: 'error',
        timer: 10000,
      });
      this.signing$.next(false);
      return;
    }
  }


  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.deny.emit();
  }

}
