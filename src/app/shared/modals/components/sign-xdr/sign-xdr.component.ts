import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, merge, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { filter, map, pluck, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import {Networks, Operation} from 'stellar-base';
import {
  HorizonApisQuery,
  IHorizonApi,
  IWalletsAccount,
  IWalletsAccountLedger,
  IWalletsAccountTrezor,
  IWalletsAccountWithSecretKey,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SignPasswordComponent } from '~root/shared/modals/components/sign-password/sign-password.component';
import { ITransaction, WalletsService } from '~root/core/wallets/services/wallets.service';
import { HardwareWalletsService } from '~root/core/services/hardware-wallets.service';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import {HorizonApisService} from '~root/core/services/horizon-apis.service';
import {NzMessageService} from 'ng-zorro-antd/message';

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
        this.nzMessageService.error(e.message);
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

  sequenceNumber$: Observable<string> = this.xdrParsed$
    .pipe(filter<ITransaction>(data => !!data))
    .pipe(pluck<ITransaction, string>('sequence'));

  source$: Observable<string> = this.xdrParsed$
    .pipe(filter<ITransaction>(data => !!data))
    .pipe(pluck<ITransaction, string>('source'));

  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountQuery.getSelectedAccount$;
  networkBeingUsed$: Observable<'Public' | 'Testnet'> = this.horizonApisQuery.getSelectedHorizonApi$
    .pipe(filter(horizon => !!horizon))
    .pipe(map(horizon => {
      return horizon.networkPassphrase === Networks.PUBLIC
        ? 'Public'
        : 'Testnet';
    }));


  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly cryptoService: CryptoService,
    private readonly walletsAccountQuery: WalletsAccountsQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly walletsService: WalletsService,
    private readonly hardwareWalletsService: HardwareWalletsService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly horizonApisService: HorizonApisService,
    private readonly nzMessageService: NzMessageService,
  ) { }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  ngOnInit(): void {
  }

  async onAccepted(): Promise<void> {
    const selectedAccount = await this.selectedAccount$.pipe(take(1)).toPromise();

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

      case 'with_trezor_wallet':
        await this.signWithTrezor(selectedAccount);
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
        this.nzMessageService.error(`We couldn't sign the transaction, please check your password is correct`);

        ref.component.instance.onClose()
          .then(() => ref.close());

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
      this.nzMessageService.error(`Device not found, please make sure you are using the correct device.`, {
        nzDuration: 4000,
      });
      this.signing$.next(false);
      return;
    }

    try {
      transport = await this.hardwareWalletsService.openLedgerConnection(targetDevice);
    } catch (e) {
      this.signing$.next(false);
      this.nzMessageService.error(`Can\'t connect with the wallet, please make sure your wallet is unlocked and using the Stellar App.`, {
        nzDuration: 4000,
      });
      return;
    }

    try {
      this.nzMessageService.info('Check your wallet and please confirm or cancel the transaction in your device.', {
        nzDuration: 4000,
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
      this.nzMessageService.error(`Make sure your wallet is unlocked and using the Stellar App. It's possible that your device doesn't support an operation to sign`, {
        nzDuration: 10000,
      });
      return;
    }
  }

  async signWithTrezor(selectedAccount: IWalletsAccountTrezor): Promise<void> {
    this.signing$.next(true);
    const xdr = await this.xdr$.pipe(take(1)).toPromise();

    const transaction = new this.stellarSdkService.SDK.Transaction(
      xdr,
      this.stellarSdkService.networkPassphrase,
    );

    await this.hardwareWalletsService.waitUntilTrezorIsInitiated();

    try {
      const signedXDR = await this.hardwareWalletsService.signWithTrezor({
        path: selectedAccount.path,
        transaction,
        networkPassphrase: this.stellarSdkService.networkPassphrase,
      });

      this.accept.emit(signedXDR);
    } catch (e) {
      console.error(e);
      this.signing$.next(false);
      this.nzMessageService.error(`Couldn't sign the transaction because there was an unexpected error, please contact support`, {
        nzDuration: 4000,
      });
    }

    this.signing$.next(false);
  }


  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.deny.emit();
  }

}
