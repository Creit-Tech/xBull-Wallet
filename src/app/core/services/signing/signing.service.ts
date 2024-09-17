import { Injectable } from '@angular/core';
import {
  AirGappedWalletProtocol,
  IWalletsAccountAirGapped,
  IWalletsAccountLedger,
  IWalletsAccountTrezor,
  IWalletsAccountWithSecretKey, IWalletWithAirGapped, SettingsQuery, WalletsQuery
} from '~root/state';
import { firstValueFrom } from 'rxjs';
import { FeeBumpTransaction, Keypair, Networks, Transaction, xdr } from 'stellar-sdk';
import { PasswordModalComponent } from '~root/shared/shared-modals/components/password-modal/password-modal.component';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { DeviceAuthService } from '~root/mobile/services/device-auth.service';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { HardwareWalletsService, IHWSigningResult } from '~root/core/services/hardware-wallets.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AirgappedWalletService } from '~root/core/services/airgapped-wallet/airgapped-wallet.service';

@Injectable({
  providedIn: 'root'
})
export class SigningService {

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly deviceAuthService: DeviceAuthService,
    private readonly cryptoService: CryptoService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly settingsService: SettingsService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly hardwareWalletsService: HardwareWalletsService,
    private readonly walletsService: WalletsService,
    private readonly nzMessageService: NzMessageService,
    private readonly walletsQuery: WalletsQuery,
    private readonly airgappedWalletService: AirgappedWalletService
  ) { }

  async signWithDeviceAuthToken(params: {
    target: Transaction | FeeBumpTransaction | xdr.HashIdPreimageSorobanAuthorization;
    network: Networks;
    selectedAccount: IWalletsAccountWithSecretKey;
  }): Promise<ISignResult> {
    const [
      passwordAuthKey,
      passwordAuthTokenIdentifier
    ] = await Promise.all([
      firstValueFrom(this.settingsQuery.passwordAuthKey$),
      firstValueFrom(this.settingsQuery.passwordAuthTokenIdentifier$),
    ]);

    if (!passwordAuthKey || !passwordAuthTokenIdentifier) {
      throw new Error('There was an error with the device authentication, please configure it again from the settings view.');
    }

    let decryptedPassword: string;
    try {
      decryptedPassword = await this.deviceAuthService.decryptWithDevice({
        identifier: passwordAuthTokenIdentifier,
        key: passwordAuthKey,
      });
    } catch (e: any) {
      throw e.message || `We were not able to decrypt the password with this device`;
    }

    let secret: string;
    let keypair: Keypair;
    try {
      secret = this.cryptoService.decryptText(params.selectedAccount.secretKey, decryptedPassword);
      keypair = this.stellarSdkService.keypairFromSecret({ secret });
    } catch (e: any) {
      throw e.message || `We couldn't decrypt the private key`;
    }

    switch (true) {
      case params.target instanceof Transaction:
      case params.target instanceof FeeBumpTransaction:
        const keypairSignature: string = params.target.getKeypairSignature(keypair as any);
        params.target.sign(keypair as any);

        return {
          signedXDR: params.target.toXDR(),
          signers: [{
            publicKey: keypair.publicKey(),
            signature: keypairSignature,
          }],
        };

      case params.target instanceof xdr.HashIdPreimageSorobanAuthorization:
      default:
        throw new Error(`The type of XDR is not supported`);
    }

  }

  async signWithPassword(params: {
    target: Transaction | FeeBumpTransaction | xdr.HashIdPreimageSorobanAuthorization;
    network: Networks;
    selectedAccount: IWalletsAccountWithSecretKey;
    ignoreKeptPassword: boolean;
  }): Promise<ISignResult> {
    let password: string;

    const isKeptPasswordActive: boolean | undefined = await firstValueFrom(this.settingsQuery.keepPasswordActive$);
    let savedPassword: string | undefined = this.settingsService.getKeptPassword();

    if (params.ignoreKeptPassword || !isKeptPasswordActive || !savedPassword) {
      const drawerRef: NzDrawerRef<PasswordModalComponent> = this.nzDrawerService.create<PasswordModalComponent>({
        nzContent: PasswordModalComponent,
        nzPlacement: 'bottom',
        nzTitle: '',
        nzHeight: 'auto',
        nzWrapClassName: 'ios-safe-y'
      });

      drawerRef.open();

      await firstValueFrom(drawerRef.afterOpen);

      const componentRef: PasswordModalComponent | null = drawerRef.getContentComponent();

      if (!componentRef) {
        throw new Error('Unexpected error, contact support code: 9998');
      }

      password = await firstValueFrom(componentRef.password);

      drawerRef.close();
    } else {
      password = savedPassword;
    }

    let secret: string;
    let keypair: Keypair;
    try {
      secret = this.cryptoService.decryptText(params.selectedAccount.secretKey, password);
      keypair = this.stellarSdkService.keypairFromSecret({ secret });
    } catch (e: any) {
      throw e.message || `We couldn't decrypt the private key`;
    }

    try {
      switch (true) {
        case params.target instanceof Transaction:
        case params.target instanceof FeeBumpTransaction:
          const keypairSignature: string = params.target.getKeypairSignature(keypair as any);
          params.target.sign(keypair as any);

          if (isKeptPasswordActive) {
            this.settingsService.setKeptPassword(password);
          }

          // We use ts-ignore here to tell the compiler to skip these lines, we set them as null to clear them before is garbage collected
          // @ts-ignore
          password = null;
          // @ts-ignore
          savedPassword = null;

          return {
            signedXDR: params.target.toXDR(),
            signers: [{
              publicKey: keypair.publicKey(),
              signature: keypairSignature,
            }],
          };

        case params.target instanceof xdr.HashIdPreimageSorobanAuthorization:
        default:
          throw new Error(`The type of XDR is not supported`);
      }
    } catch (e: any) {
      // We use ts-ignore here to tell the compiler to skip these lines, we set them as null to clear them before is garbage collected
      // @ts-ignore
      password = null;
      // @ts-ignore
      savedPassword = null;
      console.log(e);
      throw e;
    }
  }

  async signWithLedger(params: {
    target: Transaction | FeeBumpTransaction | xdr.HashIdPreimageSorobanAuthorization;
    network: Networks;
    selectedAccount: IWalletsAccountLedger;
  }): Promise<ISignResult> {
    let transport: TransportWebUSB;
    let targetDevice: USBDevice | undefined;

    try {
      const connectedDevices: USBDevice[] = await this.hardwareWalletsService.getConnectedLedgers();
      targetDevice = connectedDevices.find((device: USBDevice): boolean =>
        this.walletsService.generateLedgerWalletId(device) === params.selectedAccount.walletId);

      if (!targetDevice) {
        throw new Error('Target device not found');
      }
    } catch (e: any) {
      console.error(e);
      throw new Error('Device not found, please make sure you are using the correct device.');
    }

    try {
      transport = await this.hardwareWalletsService.openLedgerConnection(targetDevice);
    } catch (e: any) {
      console.error(e);
      throw new Error(`Can't connect with the wallet, please make sure your wallet is unlocked and using the Stellar App.`);
    }

    try {
      this.nzMessageService.info('Check your Ledger and please confirm or cancel the transaction in your device.', {
        nzDuration: 4000,
      });

      let result: IHWSigningResult;

      switch (true) {
        case params.target instanceof Transaction:
        case params.target instanceof FeeBumpTransaction:
          result = await this.hardwareWalletsService.signWithLedger({
            transaction: params.target,
            accountPath: params.selectedAccount.path,
            publicKey: params.selectedAccount.publicKey,
            transport
          });

          params.target.addSignature(result.publicKey, result.signature);

          return {
            signedXDR: params.target.toXDR(),
            signers: [{
              publicKey: result.publicKey,
              signature: result.signature,
            }],
          };

        case params.target instanceof xdr.HashIdPreimageSorobanAuthorization:
        default:
          throw new Error(`The type of XDR is not supported`);
      }
    } catch (e: any) {
      this.nzMessageService.error(e?.message || `Make sure your Ledger is unlocked and using the Stellar App. It's possible that your device doesn't support an operation type you're trying to sign`, {
        nzDuration: 10000,
      });
      throw e;
    }
  }

  async signWithTrezor(params: {
    target: Transaction | FeeBumpTransaction | xdr.HashIdPreimageSorobanAuthorization;
    network: Networks;
    selectedAccount: IWalletsAccountTrezor;
  }): Promise<ISignResult> {
    await this.hardwareWalletsService.waitUntilTrezorIsInitiated();

    let result: IHWSigningResult;

    try {
      switch (true) {
        case params.target instanceof Transaction:
        case params.target instanceof FeeBumpTransaction:
          result = await this.hardwareWalletsService.signWithTrezor({
            path: params.selectedAccount.path,
            transaction: params.target,
            networkPassphrase: params.network,
          });

          const publicKeyBytes: Buffer = Buffer.from(result.publicKey, 'hex');
          const encodedPublicKey: string = this.stellarSdkService.SDK.StrKey.encodeEd25519PublicKey(publicKeyBytes);

          params.target.addSignature(
            encodedPublicKey,
            Buffer.from(result.signature, 'hex').toString('base64')
          );

          return {
            signedXDR: params.target.toXDR(),
            signers: [{
              publicKey: result.publicKey,
              signature: result.signature,
            }],
          };

        case params.target instanceof xdr.HashIdPreimageSorobanAuthorization:
        default:
          throw new Error(`The type of XDR is not supported`);
      }
    } catch (e: any) {
      console.error(e);
      throw new Error(`Couldn't sign the transaction because there was an unexpected error, please contact support`);
    }
  }

  async signWithAirgappedWallet(params: {
    target: Transaction | FeeBumpTransaction | xdr.HashIdPreimageSorobanAuthorization;
    network: Networks;
    account: IWalletsAccountAirGapped;
  }): Promise<ISignResult> {
    const wallet: IWalletWithAirGapped | undefined = this.walletsQuery
      .getEntity(params.account.walletId) as IWalletWithAirGapped | undefined;

    let result: { signature: string };
    try {

      switch (true) {
        case params.target instanceof Transaction:
        case params.target instanceof FeeBumpTransaction:
          switch (wallet?.protocol) {
            case AirGappedWalletProtocol.KeyStone:
              if (!wallet.deviceId) {
                throw new Error('Device id is undefined, please contact support.');
              }
              result = await this.airgappedWalletService.signWithKeystone({
                path: params.account.path,
                tx: params.target,
                deviceId: wallet.deviceId,
              });
              break;

            case AirGappedWalletProtocol.LumenSigner:
              result = await this.airgappedWalletService.signTransaction({
                path: params.account.path,
                xdr: params.target.toXDR(),
                network: params.network,
              });
              break;

            default:
              throw new Error(`Protocol ${wallet?.protocol} is not supported`);
          }

          params.target.addSignature(params.account.publicKey, result.signature);

          return {
            signedXDR: params.target.toXDR(),
            signers: [{
              publicKey: params.account.publicKey,
              signature: result.signature,
            }],
          };

        case params.target instanceof xdr.HashIdPreimageSorobanAuthorization:
        default:
          throw new Error(`The type of XDR is not supported`);
      }

    } catch (e: any) {
      console.error(e);
      throw new Error(e?.message || `Couldn't sign the transaction because there was an unexpected error, please contact support`);
    }
  }
}

export interface ISignResult {
  signedXDR: string;
  signers: Array<{
    publicKey: string;
    signature: string;
  }>;
}
