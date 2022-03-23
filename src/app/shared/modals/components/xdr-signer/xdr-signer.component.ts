import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BehaviorSubject, merge, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {WalletsService} from '~root/core/wallets/services/wallets.service';
import {filter, map, pluck, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import { Networks, Operation, Transaction } from 'stellar-base';
import BigNumber from 'bignumber.js';
import {
  HorizonApisQuery,
  IWalletsAccount, IWalletsAccountLedger, IWalletsAccountTrezor,
  IWalletsAccountWithSecretKey, SettingsQuery,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import {StellarSdkService} from '~root/gateways/stellar/stellar-sdk.service';
import {CryptoService} from '~root/core/crypto/services/crypto.service';
import {ComponentCreatorService} from '~root/core/services/component-creator.service';
import {HardwareWalletsService} from '~root/core/services/hardware-wallets.service';
import {HorizonApisService} from '~root/core/services/horizon-apis.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {SignPasswordComponent} from '~root/shared/modals/components/sign-password/sign-password.component';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import {NzDrawerRef, NzDrawerService} from 'ng-zorro-antd/drawer';
import {PasswordModalComponent} from '~root/shared/modals/components/password-modal/password-modal.component';
import {DeviceAuthService} from '~root/mobile/services/device-auth.service';
import { fromUnixTime } from 'date-fns';

@Component({
  selector: 'app-xdr-signer',
  templateUrl: './xdr-signer.component.html',
  styleUrls: ['./xdr-signer.component.scss']
})
export class XdrSignerComponent implements OnInit {
  componentDestroyed$: Subject<void> = new Subject<void>();
  signing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  @Output() acceptHandler!: (signedXdr: string) => void;
  @Output() accept: EventEmitter<string> = new EventEmitter<string>();

  @Input() from: string | 'wallet' = 'wallet';

  xdr$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set xdr(data: string) {
    this.xdr$.next(data);
  }

  xdrParsed$: Observable<Transaction> = this.xdr$.asObservable()
    .pipe(map(xdr =>
      this.walletsService.parseFromXDRToTransactionInterface(xdr)
    ));

  unhandledXdrCheckerSubscription: Subscription = this.xdrParsed$
    .pipe(take(1))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(xdr => {
      try {
        this.walletsService.checkIfAllOperationsAreHandled(xdr.operations);
      } catch (e: any) {
        this.nzMessageService.error(e.message);
        this.onClose();
      }
    });

  // TODO: Handle this and a better way for the compiler understand the different types of operations
  operations$: Observable<any> = this.xdrParsed$
    .pipe(map(xdrParse => xdrParse?.operations || []));

  // TODO: Make this dynamic with a config store
  fee$: Observable<string> = this.xdrParsed$
    .pipe(filter<Transaction>(data => !!data))
    .pipe(pluck<Transaction, string>('fee'))
    .pipe(map(fee =>
      new BigNumber(fee)
        .dividedBy('10000000')
        .toString()
    ));

  memoText$: Observable<string | undefined> = this.xdrParsed$
    .pipe(filter<Transaction>(Boolean))
    .pipe(map(transaction => {
      return this.walletsService.parseMemo(transaction.memo);
    }));

  sequenceNumber$: Observable<string> = this.xdrParsed$
    .pipe(filter<Transaction>(Boolean))
    .pipe(pluck('sequence'));

  source$: Observable<string> = this.xdrParsed$
    .pipe(filter<Transaction>(Boolean))
    .pipe(pluck('source'));

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
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly settingsQuery: SettingsQuery,
    private readonly deviceAuthService: DeviceAuthService,
  ) { }

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
        const passwordAuthTokenActive = await this.settingsQuery.passwordAuthTokenActive$
          .pipe(take(1))
          .toPromise();

        if (passwordAuthTokenActive) {
          await this.signWithDeviceAuthToken(selectedAccount);
        } else {
          await this.signWithPassword(selectedAccount);
        }
        break;

      case 'with_ledger_wallet':
        await this.signWithLedger(selectedAccount);
        break;

      case 'with_trezor_wallet':
        await this.signWithTrezor(selectedAccount);
        break;
    }

  }

  async signWithDeviceAuthToken(selectedAccount: IWalletsAccountWithSecretKey): Promise<void> {
    const [
      passwordAuthToken,
      passwordAuthKey,
      passwordAuthTokenIdentifier
    ] = await Promise.all([
      this.settingsQuery.passwordAuthToken$.pipe(take(1)).toPromise(),
      this.settingsQuery.passwordAuthKey$.pipe(take(1)).toPromise(),
      this.settingsQuery.passwordAuthTokenIdentifier$.pipe(take(1)).toPromise(),
    ]);

    if (!passwordAuthKey || !passwordAuthTokenIdentifier) {
      this.nzMessageService.error(
        `There was an error with the device authentication, please configure it again from the settings view.`
      );
      return;
    }

    let decryptedPassword: string;
    try {
      decryptedPassword = await this.deviceAuthService.decryptWithDevice({
        token: passwordAuthToken,
        identifier: passwordAuthTokenIdentifier,
        key: passwordAuthKey,
      });
    } catch (e: any) {
      this.nzMessageService.error(
        e.message || `We were not able to decrypt the password with this device`
      );
      return;
    }

    this.xdr$
      .pipe(map((xdr) => {
        const secret = this.cryptoService.decryptText(selectedAccount.secretKey, decryptedPassword);
        return this.stellarSdkService.signTransaction({ xdr, secret });
      }))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(xdr => {
        this.signing$.next(false);
        this.emitData(xdr);
      }, error => {
        console.log(error);
        this.nzMessageService.error(`We couldn't sign the transaction, please try again or contact support`);
        this.signing$.next(false);
      });
  }

  async signWithPassword(selectedAccount: IWalletsAccountWithSecretKey): Promise<void> {
    const drawerRef = this.nzDrawerService.create<PasswordModalComponent>({
      nzContent: PasswordModalComponent,
      nzPlacement: 'bottom',
      nzTitle: '',
      nzHeight: 'auto'
    });

    drawerRef.open();

    await drawerRef.afterOpen.pipe(take(1)).toPromise();

    const componentRef = drawerRef.getContentComponent();

    if (!componentRef) {
      return;
    }

    componentRef.password
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
      .pipe(takeUntil(merge(
        this.componentDestroyed$,
        drawerRef.afterClose
      )))
      .subscribe(xdr => {
        this.signing$.next(false);
        this.emitData(xdr);
        drawerRef.close();
      }, error => {
        drawerRef.close();
        console.log(error);
        this.nzMessageService.error(`We couldn't sign the transaction, please check your password is correct`);

        this.signing$.next(false);
      });
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
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error(`Device not found, please make sure you are using the correct device.`, {
        nzDuration: 4000,
      });
      this.signing$.next(false);
      return;
    }

    try {
      transport = await this.hardwareWalletsService.openLedgerConnection(targetDevice);
    } catch (e: any) {
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
      this.emitData(signedXDR);
    } catch (e: any) {
      this.signing$.next(false);
      this.nzMessageService.error(e?.message || `Make sure your wallet is unlocked and using the Stellar App. It's possible that your device doesn't support an operation type you're trying to sign`, {
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

      this.emitData(signedXDR);
    } catch (e: any) {
      console.error(e);
      this.signing$.next(false);
      this.nzMessageService.error(`Couldn't sign the transaction because there was an unexpected error, please contact support`, {
        nzDuration: 4000,
      });
    }

    this.signing$.next(false);
  }

  emitData(signedXDR: string): void {
    if (!!this.acceptHandler) {
      this.acceptHandler(signedXDR);
      this.nzDrawerRef.close();
    }

    this.accept.emit(signedXDR);
    this.nzDrawerRef.close();
  }


  async onClose(): Promise<void> {
    this.nzDrawerRef.close();
  }

  dateFromEpoch(epoch: number): Date {
    return fromUnixTime(epoch);
  }

}
