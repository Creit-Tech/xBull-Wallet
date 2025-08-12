import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, of, Subject } from 'rxjs';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import {
  HorizonApisQuery,
  INetworkApi,
  IWalletsAccount,
  IWalletsAccountAirGapped,
  IWalletsAccountLedger,
  IWalletsAccountWithSecretKey,
  SettingsQuery,
  WalletAccountType,
  WalletsAccountsQuery
} from '~root/state';
import { filter, map, pluck, switchMap, take } from 'rxjs/operators';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { hash, Networks } from '@stellar/stellar-sdk';
import { ISignResult, SigningService } from '~root/core/services/signing/signing.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Buffer } from 'buffer';

@Component({
  selector: 'app-sign-message',
  templateUrl: './sign-message.component.html',
  styleUrl: './sign-message.component.scss'
})
export class SignMessageComponent {
  componentDestroyed$: Subject<void> = new Subject<void>();
  signing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  @Input() from: string | 'wallet' = 'wallet';

  message$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
  @Input() set message(data: string) {
    this.message$.next(data);
  }
  fullMessage$: Observable<Buffer> = this.message$.pipe(map((message: string | undefined): Buffer => {
    const prefix = "Stellar Signed Message:\n";
    const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    if (!message) {
      throw new Error('Message to sign must be defined');
    }

    return Buffer.concat([
      Buffer.from(prefix, 'utf8'),
      Buffer.from(message, base64regex.test(message) ? 'base64' : 'utf8'),
    ])
  }));

  @Output() signingResults: EventEmitter<ISignMessageResult> = new EventEmitter<ISignMessageResult>();
  @Output() signingResultsHandler?: (data: ISignMessageResult) => any;

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

  pickedNetworkPassphrase$: BehaviorSubject<INetworkApi['networkPassphrase'] | undefined> = new BehaviorSubject<INetworkApi['networkPassphrase'] | undefined>(undefined);
  @Input() set pickedNetworkPassphrase(networkPassphrase: INetworkApi['networkPassphrase']) {
    this.pickedNetworkPassphrase$.next(networkPassphrase);
  }

  selectedNetworkPassphrase$: Observable<INetworkApi['networkPassphrase']> = this.pickedNetworkPassphrase$
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

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly walletsAccountQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly horizonApisService: HorizonApisService,
    private readonly settingsQuery: SettingsQuery,
    private readonly signingService: SigningService,
    private readonly nzMessageService: NzMessageService,
  ) {}

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async sign(): Promise<ISignMessageResult> {
    const selectedAccount: IWalletsAccount = await firstValueFrom(this.selectedAccount$);

    if (!selectedAccount) {
      // TODO: Handle this case
      throw new Error();
    }

    switch (selectedAccount.type) {
      case WalletAccountType.with_secret_key:
        const passwordAuthTokenActive: boolean | undefined = await this.settingsQuery.passwordAuthTokenActive$
          .pipe(take(1))
          .toPromise();

        if (passwordAuthTokenActive) {
          return this.signWithDeviceAuthToken(selectedAccount);
        } else {
          return this.signWithPassword(selectedAccount);
        }

      case WalletAccountType.with_ledger_wallet:
        return this.signWithLedger(selectedAccount);

      case WalletAccountType.with_air_gapped:
        return this.signWithAirgappedWallet(selectedAccount);

      case WalletAccountType.with_trezor_wallet:
        this.nzMessageService.error(
          `Message signing is not currently supported by our Trezor integration`,
          { nzDuration: 5000 }
        );
        throw new Error(`Message signing is not currently supported by our Trezor integration`);

      default:
        this.nzMessageService.error(
          `Incompatible type of account. Please contact support.`,
          { nzDuration: 5000 }
        );
        throw new Error(`Incompatible type of account. Please contact support.`);
    }
  }

  async signWithDeviceAuthToken(selectedAccount: IWalletsAccountWithSecretKey): Promise<ISignMessageResult> {
    try {
      const message: string | undefined = this.message$.getValue();
      const fullMessage: Buffer | undefined = await firstValueFrom(this.fullMessage$);
      if (!message || !fullMessage) {
        throw new Error('Message is undefined, please contact support');
      }
      const selectedNetworkPassphrase: Networks = await firstValueFrom(this.selectedNetworkPassphrase$);

      const result: ISignResult = await this.signingService.signWithDeviceAuthToken({
        target: hash(fullMessage),
        network: selectedNetworkPassphrase,
        selectedAccount,
      });

      this.signing$.next(false);
      return {
        message,
        fullMessage: fullMessage.toString('base64'),
        signedMessage: result.signedXDR,
        signer: selectedAccount.publicKey,
      };
    } catch (e) {
      console.log(e);
      this.nzMessageService.error(`We couldn't sign the transaction, please try again or contact support`);
      this.signing$.next(false);
      throw e;
    }
  }

  async signWithPassword(selectedAccount: IWalletsAccountWithSecretKey): Promise<ISignMessageResult> {
    this.signing$.next(true);

    try {
      const message: string | undefined = this.message$.getValue();
      const fullMessage: Buffer | undefined = await firstValueFrom(this.fullMessage$);
      if (!message || !fullMessage) {
        throw new Error('Message is undefined, please contact support');
      }
      const selectedNetworkPassphrase: Networks = await firstValueFrom(this.selectedNetworkPassphrase$);

      const result = await this.signingService.signWithPassword({
        selectedAccount,
        network: selectedNetworkPassphrase,
        target: hash(fullMessage),
        ignoreKeptPassword: false,
      });

      this.signing$.next(false);
      return {
        message,
        fullMessage: fullMessage.toString('base64'),
        signedMessage: result.signedXDR,
        signer: selectedAccount.publicKey,
      };
    } catch (error) {
      console.log(error);
      this.nzMessageService.error(`We couldn't sign the transaction, please check your password is correct`);
      this.signing$.next(false);
      throw error;
    }
  }

  async signWithLedger(selectedAccount: IWalletsAccountLedger): Promise<ISignMessageResult> {
    this.signing$.next(true);

    try {
      const message: string | undefined = this.message$.getValue();
      const fullMessage: Buffer | undefined = await firstValueFrom(this.fullMessage$);
      if (!message || !fullMessage) {
        throw new Error('Message is undefined, please contact support');
      }
      const selectedNetworkPassphrase: Networks = await firstValueFrom(this.selectedNetworkPassphrase$);

      const result: ISignResult = await this.signingService.signWithLedger({
        target: hash(fullMessage),
        network: selectedNetworkPassphrase,
        selectedAccount,
      });

      this.signing$.next(false);

      return {
        message,
        fullMessage: fullMessage.toString('base64'),
        signedMessage: result.signedXDR,
        signer: selectedAccount.publicKey,
      };
    } catch (e: any) {
      this.signing$.next(false);
      this.nzMessageService.error(e?.message || `Make sure your Ledger is unlocked and using the Stellar App. It's possible that your device doesn't support an operation type you're trying to sign`, {
        nzDuration: 10000,
      });
      throw e;
    }
  }

  async signWithAirgappedWallet(selectedAccount: IWalletsAccountAirGapped): Promise<ISignMessageResult> {
    this.signing$.next(true);

    try {
      const message: string | undefined = this.message$.getValue();
      const fullMessage: Buffer | undefined = await firstValueFrom(this.fullMessage$);
      if (!message || !fullMessage) {
        throw new Error('Message is undefined, please contact support');
      }
      const selectedNetworkPassphrase: Networks = await firstValueFrom(this.selectedNetworkPassphrase$);
      const result = await this.signingService.signWithAirgappedWallet({
        target: hash(fullMessage),
        network: selectedNetworkPassphrase,
        account: selectedAccount,
      });

      this.signing$.next(false);

      return {
        message,
        fullMessage: fullMessage.toString('base64'),
        signedMessage: result.signedXDR,
        signer: selectedAccount.publicKey,
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


  emitSigningResults(data: ISignMessageResult): void {
    if (!!this.signingResultsHandler) {
      this.signingResultsHandler(data);
    }

    this.signingResults.emit(data);
    this.nzDrawerRef.close();
  }

  async signAndEmit(): Promise<void> {
    const result: ISignMessageResult = await this.sign();
    this.emitSigningResults(result);
  }

  async onClose(): Promise<void> {
    this.componentDestroyed$.next();
    this.nzDrawerRef.close();
  }
}

export interface ISignMessageResult {
  message: string;
  fullMessage: string; // This is the message with the SEP-0053 text
  signedMessage: string;
  signer: string;
}
