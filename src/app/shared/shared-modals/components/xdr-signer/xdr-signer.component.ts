import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { filter, map, pluck, switchMap, take, takeUntil } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import {
  AirGappedWalletProtocol,
  HorizonApisQuery,
  IHorizonApi,
  IWalletsAccount,
  IWalletsAccountAirGapped,
  IWalletsAccountLedger,
  IWalletsAccountTrezor,
  IWalletsAccountWithSecretKey,
  IWalletWithAirGapped,
  SettingsQuery,
  WalletAccountType,
  WalletsAccountsQuery,
  WalletsQuery,
} from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
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
import { FeeBumpTransaction, Keypair, Networks, Operation, Transaction } from 'stellar-sdk';
import { ClipboardService } from '~root/core/services/clipboard.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-xdr-signer',
  templateUrl: './xdr-signer.component.html',
  styleUrls: ['./xdr-signer.component.scss']
})
export class XdrSignerComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  signing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportXdr$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
  exportXdrQr$: Observable<string | undefined> = this.exportXdr$
    .pipe(
      switchMap((xdr: string | undefined) => {
        return !xdr ? of(undefined) : QRCode.toDataURL(xdr);
      }),
    );

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

  xdr$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
  xdrParsed$: ReplaySubject<Transaction | FeeBumpTransaction> = new ReplaySubject<Transaction | FeeBumpTransaction>(0);
  transactionType$: ReplaySubject<'Transaction' | 'Fee Bump Transaction'> = new ReplaySubject<'Transaction' | 'Fee Bump Transaction'>(0);
  @Input() set xdr(data: string) {
    try {
      const parsedXdr = this.stellarSdkService.createTransaction({ xdr: data });
      this.xdr$.next(data);
      this.xdrParsed$.next(parsedXdr as any);
      this.transactionType$.next(parsedXdr instanceof FeeBumpTransaction ? 'Fee Bump Transaction' : 'Transaction');
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
          this.stellarSdkService.checkIfAllOperationsAreHandled(
            xdr instanceof FeeBumpTransaction ? xdr.innerTransaction.operations : xdr.operations
          );
      } catch (e: any) {
        this.nzMessageService.error(e.message);
        this.onClose();
      }
    });

  // TODO: Handle this and a better way for the compiler understand the different types of operations
  operations$: Observable<any> = this.xdrParsed$
    .pipe(
      map(xdrParse => {
        return xdrParse instanceof FeeBumpTransaction
          ? xdrParse.innerTransaction.operations || []
          : xdrParse?.operations || [];
      })
    );

  fee$: Observable<string> = this.xdrParsed$
    .pipe(filter<Transaction | FeeBumpTransaction>(data => !!data))
    .pipe(map<Transaction | FeeBumpTransaction, string>(tx => {
      return tx instanceof Transaction
        ? tx.fee
        : tx.innerTransaction.fee;
    }))
    .pipe(map(fee =>
      new BigNumber(fee)
        .dividedBy('10000000')
        .toString()
    ));

  memoText$: Observable<string | undefined> = this.xdrParsed$
    .pipe(filter<Transaction | FeeBumpTransaction>(Boolean))
    .pipe(map(transaction => {
      return this.walletsService.parseMemo(
        transaction instanceof FeeBumpTransaction ? transaction.innerTransaction.memo : transaction.memo
      );
    }));

  sequenceNumber$: Observable<string> = this.xdrParsed$
    .pipe(filter<Transaction | FeeBumpTransaction>(Boolean))
    .pipe(map(tx => {
      return tx instanceof FeeBumpTransaction
        ? tx.innerTransaction.sequence
        : tx.sequence;
    }));

  source$: Observable<string> = this.xdrParsed$
    .pipe(filter<Transaction | FeeBumpTransaction>(Boolean))
    .pipe(map(tx => {
      return tx instanceof Transaction ? tx.source : tx.innerTransaction.source;
    }));

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
      return operations.map((operation: Operation.InvokeHostFunction, i) => {
        return (operation.auth || []).map((auth) => {
          return this.hostFunctionsService.parseHostFunctionIntoNodeTree(auth.rootInvocation(), i);
        });
      }).flat();
    }));


  constructor(
    private readonly stellarSdkService: StellarSdkService,
    private readonly cryptoService: CryptoService,
    private readonly walletsAccountQuery: WalletsAccountsQuery,
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
    private readonly clipboardService: ClipboardService,
    private readonly walletsQuery: WalletsQuery,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async sign(): Promise<ISigningResults> {
    const selectedAccount = await this.selectedAccount$.pipe(take(1)).toPromise();

    if (!selectedAccount) {
      // TODO: Handle this case
      throw new Error();
    }

    switch (selectedAccount.type) {
      case WalletAccountType.with_secret_key:
        const passwordAuthTokenActive = await this.settingsQuery.passwordAuthTokenActive$
          .pipe(take(1))
          .toPromise();

        if (passwordAuthTokenActive) {
          return this.signWithDeviceAuthToken(selectedAccount);
        } else {
          return this.signWithPassword(selectedAccount);
        }

      case WalletAccountType.with_ledger_wallet:
        return this.signWithLedger(selectedAccount);

      case WalletAccountType.with_trezor_wallet:
        return this.signWithTrezor(selectedAccount);

      case WalletAccountType.with_air_gapped:
        return this.signWithAirgappedWallet(selectedAccount);

      default:
        this.nzMessageService.error(
          `Incompatible type of account. Please contact support.`,
          { nzDuration: 5000 }
        );
        throw new Error(`Incompatible type of account. Please contact support.`);
    }
  }

  async signAndEmit(): Promise<void> {
    const result: ISigningResults = await this.sign();

    // DEPRECATED
    this.emitData(result.signedXDR);

    this.emitSigningResults({
      baseXDR: result.baseXDR,
      transaction: result.transaction,
      signedXDR: result.signedXDR,
      signers: result.signers,
    });
  }

  async export(): Promise<void> {
    const xdr: string | undefined = this.xdr$.getValue();

    if (!xdr) {
      throw new Error('XDR is undefined, please contact support');
    }

    this.exportXdr$.next(xdr);
  }

  async signAndSport(): Promise<void> {
    const result: ISigningResults = await this.sign();
    this.exportXdr$.next(result.signedXDR);
  }

  async signWithDeviceAuthToken(selectedAccount: IWalletsAccountWithSecretKey): Promise<ISigningResults> {
    const [
      passwordAuthKey,
      passwordAuthTokenIdentifier
    ] = await Promise.all([
      firstValueFrom(this.settingsQuery.passwordAuthKey$),
      firstValueFrom(this.settingsQuery.passwordAuthTokenIdentifier$),
    ]);

    if (!passwordAuthKey || !passwordAuthTokenIdentifier) {
      this.nzMessageService.error(
        `There was an error with the device authentication, please configure it again from the settings view.`
      );
      throw new Error('There was an error with the device authentication, please configure it again from the settings view.');
    }

    let decryptedPassword: string;
    try {
      decryptedPassword = await this.deviceAuthService.decryptWithDevice({
        identifier: passwordAuthTokenIdentifier,
        key: passwordAuthKey,
      });
    } catch (e: any) {
      this.nzMessageService.error(
        e.message || `We were not able to decrypt the password with this device`
      );
      throw e;
    }

    try {
      const xdr: string | undefined = this.xdr$.getValue();

      if (!xdr) {
        throw new Error('XDR is undefined, please contact support');
      }

      const selectedNetworkPassphrase: Networks = await firstValueFrom(this.selectedNetworkPassphrase$);
      const secret: string = this.cryptoService.decryptText(selectedAccount.secretKey, decryptedPassword);
      const transaction: Transaction | FeeBumpTransaction = this.stellarSdkService.createTransaction({
        xdr,
        networkPassphrase: selectedNetworkPassphrase
      });
      const keypair: Keypair = this.stellarSdkService.keypairFromSecret({ secret });

      // TODO: Once we merge soroban and stellar sdk, we should rethink this "as any"
      const keypairSignature = transaction.getKeypairSignature(keypair as any);
      transaction.sign(keypair as any);

      this.signing$.next(false);
      return {
        baseXDR: xdr,
        signedXDR: transaction.toXDR(),
        transaction,
        signers: [{
          publicKey: keypair.publicKey(),
          signature: keypairSignature,
        }],
      };
    } catch (e) {
      console.log(e);
      this.nzMessageService.error(`We couldn't sign the transaction, please try again or contact support`);
      this.signing$.next(false);
      throw e;
    }
  }

  async signWithPassword(selectedAccount: IWalletsAccountWithSecretKey): Promise<ISigningResults> {
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
        throw new Error('Unexpected error, contact support code: 9998');
      }

      password = await firstValueFrom(componentRef.password);

      drawerRef.close();
    } else {
      password = savedPassword;
    }

    this.signing$.next(true);

    try {
      const secret = this.cryptoService.decryptText(selectedAccount.secretKey, password);

      const xdr = this.xdr$.getValue();

      if (!xdr) {
        throw new Error('XDR is undefined, please contact support');
      }

      const selectedNetworkPassphrase = await this.selectedNetworkPassphrase$.pipe(take(1)).toPromise();

      const transaction = this.stellarSdkService.createTransaction({
        xdr,
        networkPassphrase: selectedNetworkPassphrase
      });

      const keypair = this.stellarSdkService.keypairFromSecret({ secret });

      // TODO: Once we merge soroban and stellar sdk, we should rethink this "as any"
      const keypairSignature = transaction.getKeypairSignature(keypair as any);
      transaction.sign(keypair as any);

      const signedXDR = transaction.toXDR();

      this.signing$.next(false);

      if (isKeptPasswordActive) {
        this.settingsService.setKeptPassword(password);
      }


      // We use ts-ignore here to tell the compiler to skip these lines, we set them as null to clear them before is garbage collected
      // @ts-ignore
      password = null;
      // @ts-ignore
      savedPassword = null;

      return {
        baseXDR: xdr,
        signedXDR,
        transaction,
        signers: [{
          publicKey: keypair.publicKey(),
          signature: keypairSignature
        }]
      };
    } catch (error) {
      // We use ts-ignore here to tell the compiler to skip these lines, we set them as null to clear them before is garbage collected
      // @ts-ignore
      password = null;
      // @ts-ignore
      savedPassword = null;
      console.log(error);
      this.nzMessageService.error(`We couldn't sign the transaction, please check your password is correct`);
      this.signing$.next(false);
      throw error;
    }
  }

  async signWithLedger(selectedAccount: IWalletsAccountLedger): Promise<ISigningResults> {
    this.signing$.next(true);
    const xdr = this.xdr$.getValue();

    if (!xdr) {
      throw new Error('XDR is undefined, please contact support');
    }

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
      throw e;
    }

    try {
      transport = await this.hardwareWalletsService.openLedgerConnection(targetDevice);
    } catch (e: any) {
      this.signing$.next(false);
      this.nzMessageService.error(`Can\'t connect with the wallet, please make sure your wallet is unlocked and using the Stellar App.`, {
        nzDuration: 4000,
      });
      throw e;
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
        blindTransaction: transaction instanceof FeeBumpTransaction
          ? !!transaction.innerTransaction.operations.find(o => o.type === 'invokeHostFunction')
          : !!transaction.operations.find(o => o.type === 'invokeHostFunction'),
      });

      transaction.addSignature(result.publicKey, result.signature);
      const signedXDR = transaction.toXDR();

      this.signing$.next(false);

      // DEPRECATED
      return {
        baseXDR: xdr,
        signedXDR,
        transaction,
        signers: [{
          publicKey: result.publicKey,
          signature: result.signature,
        }],
      };
    } catch (e: any) {
      this.signing$.next(false);
      this.nzMessageService.error(e?.message || `Make sure your Ledger is unlocked and using the Stellar App. It's possible that your device doesn't support an operation type you're trying to sign`, {
        nzDuration: 10000,
      });
      throw e;
    }
  }

  async signWithTrezor(selectedAccount: IWalletsAccountTrezor): Promise<ISigningResults> {
    this.signing$.next(true);
    const xdr = this.xdr$.getValue();

    if (!xdr) {
      throw new Error('XDR is undefined, please contact support');
    }

    const networkPassphrase = await firstValueFrom(this.selectedNetworkPassphrase$);

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

      this.signing$.next(false);
      return {
        baseXDR: xdr,
        transaction,
        signedXDR: transaction.toXDR(),
        signers: [{
          publicKey: result.publicKey,
          signature: result.signature,
        }],
      };
    } catch (e: any) {
      console.error(e);
      this.signing$.next(false);
      this.nzMessageService.error(`Couldn't sign the transaction because there was an unexpected error, please contact support`, {
        nzDuration: 4000,
      });
      throw e;
    }
  }

  async signWithAirgappedWallet(account: IWalletsAccountAirGapped): Promise<ISigningResults> {
    this.signing$.next(true);
    const xdr = this.xdr$.getValue();

    if (!xdr) {
      throw new Error('XDR is undefined, please contact support');
    }

    const networkPassphrase = await firstValueFrom(this.selectedNetworkPassphrase$);

    const transaction = this.stellarSdkService.createTransaction({
      xdr,
      networkPassphrase,
    });

    const wallet: IWalletWithAirGapped | undefined = this.walletsQuery.getEntity(account.walletId) as IWalletWithAirGapped | undefined;

    try {
      let result: { signature: string };
      switch (wallet?.protocol) {
        case AirGappedWalletProtocol.KeyStone:
          if (!wallet.deviceId) {
            throw new Error('Device id is undefined, please contact support.');
          }
          result = await this.airgappedWalletService.signWithKeystone({
            path: account.path,
            tx: transaction,
            deviceId: wallet.deviceId,
          });
          break;

        case AirGappedWalletProtocol.LumenSigner:
          result = await this.airgappedWalletService.signTransaction({
            path: account.path,
            xdr: transaction.toXDR(),
            network: networkPassphrase,
          });
          break;

        default:
          throw new Error(`Protocol ${wallet?.protocol} is not supported`);
      }

      transaction.addSignature(account.publicKey, result.signature);

      this.signing$.next(false);

      return {
        baseXDR: xdr,
        transaction,
        signedXDR: transaction.toXDR(),
        signers: [{
          publicKey: account.publicKey,
          signature: result.signature,
        }],
      };
    } catch (e: any) {
      console.error(e);
      this.signing$.next(false);
      this.nzMessageService.error(
        e?.message || `Couldn't sign the transaction because there was an unexpected error, please contact support`,
        { nzDuration: 4000 }
      );
      throw e;
    }
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

  copyToClipboard(): void {
    const exportXdr = this.exportXdr$.getValue();
    if (exportXdr) {
      this.clipboardService.copyToClipboard(exportXdr);
      this.nzMessageService.success('XDR copied to the clipboard');
      this.exportXdr$.next(undefined);
    } else {
      this.nzMessageService.error('XDR is not available, contact support');
      this.exportXdr$.next(undefined);
    }
  }

}


export interface ISigningResults {
  transaction: Transaction | FeeBumpTransaction;
  baseXDR: string;
  signedXDR: string;
  signers: Array<{
    publicKey: string;
    signature: string;
  }>;
}
