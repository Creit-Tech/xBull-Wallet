import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { filter, map, pluck, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import {
  HorizonApisQuery,
  IHorizonApi,
  IWalletsAccount, IWalletsAccountAirGapped,
  IWalletsAccountLedger,
  IWalletsAccountTrezor,
  IWalletsAccountWithSecretKey,
  SettingsQuery,
  WalletAccountType,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { HardwareWalletsService } from '~root/core/services/hardware-wallets.service';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { PasswordModalComponent } from '~root/shared/shared-modals/components/password-modal/password-modal.component';
import { DeviceAuthService } from '~root/mobile/services/device-auth.service';
import { fromUnixTime } from 'date-fns';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { distinctUntilArrayItemChanged } from '@datorama/akita';
import { HostFunctionsService } from '~root/core/services/host-functions/host-functions.service';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree/nz-tree-base-node';
import { AirgappedWalletService } from '~root/core/services/airgapped-wallet/airgapped-wallet.service';
import { Operation, Transaction } from 'stellar-sdk';

@Component({
  selector: 'app-xdr-signer',
  templateUrl: './xdr-signer.component.html',
  styleUrls: ['./xdr-signer.component.scss']
})
export class XdrSignerComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  signing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Deprecated
  @Output() acceptHandler!: (result: string) => void;
  // Deprecated
  @Output() accept: EventEmitter<string> = new EventEmitter<string>();

  @Output() signingResults: EventEmitter<ISigningResults> = new EventEmitter<ISigningResults>();
  @Output() signingResultsHandler?: (data: ISigningResults) => any;

  @Input() from: string | 'wallet' = 'wallet';

  // This variable should be used in places where we really want to make sure user writes its password again
  // Example will be when getting a request from a website
  @Input() ignoreKeptPassword = false;

  xdr$: ReplaySubject<string> = new ReplaySubject<string>();
  xdrParsed$: ReplaySubject<Transaction> = new ReplaySubject<Transaction>();
  @Input() set xdr(data: string) {
    try {
      const parsedXdr = this.stellarSdkService.createTransaction({ xdr: data });
      this.xdr$.next(data);
      this.xdrParsed$.next(parsedXdr as any);
    } catch (e) {
      console.error(e);
      this.nzMessageService.error('The transaction you are trying to sign is invalid');
      this.onClose();
    }
  }

  pickedAccount$: BehaviorSubject<IWalletsAccount | undefined> = new BehaviorSubject<IWalletsAccount | undefined>(undefined);
  @Input() set pickedAccount(account: IWalletsAccount) {
    this.pickedAccount$.next(account);
  }

  selectedAccount$: Observable<IWalletsAccount> = this.pickedAccount$
    .asObservable()
    .pipe(switchMap(pickedAccount => {
      return !!pickedAccount
        ? of(pickedAccount)
        : this.walletsAccountQuery.getSelectedAccount$;
    }));

  pickedNetworkPassphrase$: BehaviorSubject<IHorizonApi['networkPassphrase'] | undefined> = new BehaviorSubject<IHorizonApi['networkPassphrase'] | undefined>(undefined);
  @Input() set pickedNetworkPassphrase(networkPassphrase: IHorizonApi['networkPassphrase']) {
    this.pickedNetworkPassphrase$.next(networkPassphrase);
  }

  selectedNetworkPassphrase$: Observable<IHorizonApi['networkPassphrase']> = this.pickedNetworkPassphrase$
    .asObservable()
    .pipe(switchMap(pickedNetworkPassphrase => {
      return !!pickedNetworkPassphrase
        ? of(pickedNetworkPassphrase)
        : this.horizonApisQuery.getSelectedHorizonApi$
          .pipe(pluck('networkPassphrase'));
    }));

  networkBeingUsed$: Observable<string> = this.selectedNetworkPassphrase$
    .pipe(filter(horizon => !!horizon))
    .pipe(map(networkPassphrase => {
      return this.horizonApisService.userNetworkName(networkPassphrase);
    }));

  unhandledXdrCheckerSubscription: Subscription = this.xdrParsed$
    .pipe(take(1))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(xdr => {
      try {
        this.stellarSdkService.checkIfAllOperationsAreHandled(xdr.operations);
      } catch (e: any) {
        this.nzMessageService.error(e.message);
        this.onClose();
      }
    });

  // TODO: Handle this and a better way for the compiler understand the different types of operations
  operations$: Observable<any> = this.xdrParsed$
    .pipe(map(xdrParse => xdrParse?.operations || []));

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

  /**
   * This observable includes all possible invoke functions from the tx and tries to parse them
   */
  invokeFunctions$: Observable<Array<NzTreeNodeOptions[]>> = this.operations$
    .pipe(distinctUntilArrayItemChanged())
    .pipe(map((operations: any) => {
      return operations.filter(
        (operation: Operation) => operation.type === 'invokeHostFunction'
      );
    }))
    .pipe(map((operations: any[]) => {
      return operations.map((operation, i) => {
        return this.hostFunctionsService.parseHostFunctionIntoNodeTree(operation.function, i);
      });
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
    private readonly settingsService: SettingsService,
    private readonly hostFunctionsService: HostFunctionsService,
    private readonly airgappedWalletService: AirgappedWalletService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onAccepted(): Promise<void> {
    const selectedAccount = await this.selectedAccount$.pipe(take(1)).toPromise();

    if (!selectedAccount) {
      // TODO: Handle this case
      return;
    }

    switch (selectedAccount.type) {
      case WalletAccountType.with_secret_key:
        const passwordAuthTokenActive = await this.settingsQuery.passwordAuthTokenActive$
          .pipe(take(1))
          .toPromise();

        if (passwordAuthTokenActive) {
          await this.signWithDeviceAuthToken(selectedAccount);
        } else {
          await this.signWithPassword(selectedAccount);
        }
        break;

      case WalletAccountType.with_ledger_wallet:
        await this.signWithLedger(selectedAccount);
        break;

      case WalletAccountType.with_trezor_wallet:
        await this.signWithTrezor(selectedAccount);
        break;

      case WalletAccountType.with_air_gapped:
        await this.signWithAirgappedWallet(selectedAccount);
        break;

      default:
        this.nzMessageService.error(
          `Incompatible type of account. Please contact support.`,
          { nzDuration: 5000 }
        );
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
      .pipe(withLatestFrom(this.selectedNetworkPassphrase$))
      .pipe(map(([xdr, selectedNetworkPassphrase]) => {
        const secret = this.cryptoService.decryptText(selectedAccount.secretKey, decryptedPassword);
        const transaction = this.stellarSdkService.createTransaction({
          xdr,
          networkPassphrase: selectedNetworkPassphrase
        });
        const keypair = this.stellarSdkService.keypairFromSecret({ transaction, secret });

        // TODO: Once we merge soroban and stellar sdk, we should rethink this "as any"
        const keypairSignature = transaction.getKeypairSignature(keypair as any);
        transaction.sign(keypair as any);

        return {
          baseXDR: xdr,
          signedXDR: transaction.toXDR(),
          transaction,
          signers: [{
            publicKey: keypair.publicKey(),
            signature: keypairSignature,
          }],
        };
      }))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((result: ISigningResults) => {
        this.signing$.next(false);

        // DEPRECATED
        this.emitData(result.signedXDR);

        this.emitSigningResults(result);
      }, error => {
        console.log(error);
        this.nzMessageService.error(`We couldn't sign the transaction, please try again or contact support`);
        this.signing$.next(false);
      });
  }

  async signWithPassword(selectedAccount: IWalletsAccountWithSecretKey): Promise<void> {
    let password: string;

    const isKeptPasswordActive = await this.settingsQuery.keepPasswordActive$.pipe(take(1)).toPromise();
    let savedPassword = this.settingsService.getKeptPassword();
    if (this.ignoreKeptPassword || !isKeptPasswordActive || !savedPassword) {
      const drawerRef = this.nzDrawerService.create<PasswordModalComponent>({
        nzContent: PasswordModalComponent,
        nzPlacement: 'bottom',
        nzTitle: '',
        nzHeight: 'auto',
        nzWrapClassName: 'ios-safe-y'
      });

      drawerRef.open();

      await drawerRef.afterOpen.pipe(take(1)).toPromise();

      const componentRef = drawerRef.getContentComponent();

      if (!componentRef) {
        return;
      }

      password = await componentRef.password
        .pipe(take(1))
        .toPromise();

      drawerRef.close();
    } else {
      password = savedPassword;
    }

    this.signing$.next(true);

    try {
      const secret = this.cryptoService.decryptText(selectedAccount.secretKey, password);

      const xdr = await this.xdr$.pipe(take(1)).toPromise();
      const selectedNetworkPassphrase = await this.selectedNetworkPassphrase$.pipe(take(1)).toPromise();

      const transaction = this.stellarSdkService.createTransaction({
        xdr,
        networkPassphrase: selectedNetworkPassphrase
      });

      const keypair = this.stellarSdkService.keypairFromSecret({ transaction, secret });

      // TODO: Once we merge soroban and stellar sdk, we should rethink this "as any"
      const keypairSignature = transaction.getKeypairSignature(keypair as any);
      transaction.sign(keypair as any);

      const signedXDR = transaction.toXDR();

      this.signing$.next(false);

      if (isKeptPasswordActive) {
        this.settingsService.setKeptPassword(password);
      }

      // DEPRECATED
      this.emitData(signedXDR);

      this.emitSigningResults({
        baseXDR: xdr,
        signedXDR,
        transaction,
        signers: [{
          publicKey: keypair.publicKey(),
          signature: keypairSignature
        }]
      });
    } catch (error) {
      console.log(error);
      this.nzMessageService.error(`We couldn't sign the transaction, please check your password is correct`);

      this.signing$.next(false);
    }

    // We use ts-ignore here to tell the compiler to skip these lines, we set them as null to clear them before is garbage collected
    // @ts-ignore
    password = null;
    // @ts-ignore
    savedPassword = null;
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
      this.nzMessageService.info('Check your Ledger and please confirm or cancel the transaction in your device.', {
        nzDuration: 4000,
      });

      const passphrase = await this.selectedNetworkPassphrase$.pipe(take(1)).toPromise();

      const transaction = this.stellarSdkService.createTransaction({
        xdr,
        networkPassphrase: passphrase,
      });

      const result = await this.hardwareWalletsService.signWithLedger({
        transaction,
        accountPath: selectedAccount.path,
        publicKey: selectedAccount.publicKey,
        transport,
      });

      transaction.addSignature(result.publicKey, result.signature);
      const signedXDR = transaction.toXDR();

      this.signing$.next(false);

      // DEPRECATED
      this.emitData(signedXDR);

      this.emitSigningResults({
        baseXDR: xdr,
        signedXDR,
        transaction,
        signers: [{
          publicKey: result.publicKey,
          signature: result.signature,
        }],
      });
    } catch (e: any) {
      this.signing$.next(false);
      this.nzMessageService.error(e?.message || `Make sure your Ledger is unlocked and using the Stellar App. It's possible that your device doesn't support an operation type you're trying to sign`, {
        nzDuration: 10000,
      });
      return;
    }
  }

  async signWithTrezor(selectedAccount: IWalletsAccountTrezor): Promise<void> {
    this.signing$.next(true);
    const xdr = await this.xdr$.pipe(take(1)).toPromise();
    const networkPassphrase = await this.selectedNetworkPassphrase$.pipe(take(1)).toPromise();

    const transaction = this.stellarSdkService.createTransaction({
      xdr,
      networkPassphrase,
    });

    await this.hardwareWalletsService.waitUntilTrezorIsInitiated();

    try {
      const result = await this.hardwareWalletsService.signWithTrezor({
        path: selectedAccount.path,
        transaction,
        networkPassphrase,
      });

      const publicKeyBytes = Buffer.from(result.publicKey, 'hex');
      const encodedPublicKey = this.stellarSdkService.SDK.StrKey.encodeEd25519PublicKey(publicKeyBytes);

      transaction.addSignature(
        encodedPublicKey,
        Buffer.from(result.signature, 'hex').toString('base64')
      );

      // DEPRECATED
      this.emitData(transaction.toXDR());

      this.emitSigningResults({
        baseXDR: xdr,
        transaction,
        signedXDR: transaction.toXDR(),
        signers: [{
          publicKey: result.publicKey,
          signature: result.signature,
        }],
      });
    } catch (e: any) {
      console.error(e);
      this.signing$.next(false);
      this.nzMessageService.error(`Couldn't sign the transaction because there was an unexpected error, please contact support`, {
        nzDuration: 4000,
      });
    }

    this.signing$.next(false);
  }

  async signWithAirgappedWallet(account: IWalletsAccountAirGapped): Promise<void> {
    this.signing$.next(true);
    const xdr = await this.xdr$.pipe(take(1)).toPromise();
    const networkPassphrase = await this.selectedNetworkPassphrase$.pipe(take(1)).toPromise();

    const transaction = this.stellarSdkService.createTransaction({
      xdr,
      networkPassphrase,
    });

    try {
      const result = await this.airgappedWalletService.signTransaction({
        path: account.path,
        xdr: transaction.toXDR(),
        network: networkPassphrase,
      });

      transaction.addSignature(account.publicKey, result.signature);

      // DEPRECATED
      this.emitData(transaction.toXDR());

      this.emitSigningResults({
        baseXDR: xdr,
        transaction,
        signedXDR: transaction.toXDR(),
        signers: [{
          publicKey: account.publicKey,
          signature: result.signature,
        }],
      });
    } catch (e: any) {
      console.error(e);
      this.signing$.next(false);
      this.nzMessageService.error(
        e?.message || `Couldn't sign the transaction because there was an unexpected error, please contact support`,
        { nzDuration: 4000 }
      );
    }

    this.signing$.next(false);
  }

  // DEPRECATED
  emitData(result: string): void {
    if (!!this.acceptHandler) {
      this.acceptHandler(result);
      this.nzDrawerRef.close();
    }

    this.accept.emit(result);
    this.nzDrawerRef.close();
  }

  emitSigningResults(data: ISigningResults): void {
    if (!!this.signingResultsHandler) {
      this.signingResultsHandler(data);
    }

    this.signingResults.emit(data);
    this.nzDrawerRef.close();
  }


  async onClose(): Promise<void> {
    this.componentDestroyed$.next();
    this.nzDrawerRef.close();
  }

  dateFromEpoch(epoch: number): Date {
    return fromUnixTime(epoch);
  }

}


export interface ISigningResults {
  transaction: Transaction;
  baseXDR: string;
  signedXDR: string;
  signers: Array<{
    publicKey: string;
    signature: string;
  }>;
}
