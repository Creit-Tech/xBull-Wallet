import { Inject, Injectable } from '@angular/core';
import { FeeBumpTransaction, StrKey, Transaction } from '@stellar/stellar-sdk';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  AirgappedXdrSignerComponent
} from '~root/shared/shared-modals/components/airgapped-xdr-signer/airgapped-xdr-signer.component';
import {
  AirgappedPublicKeyComponent
} from '~root/shared/shared-modals/components/airgapped-public-key/airgapped-public-key.component';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { DOCUMENT } from '@angular/common';
import KeystoneSDK, { MultiAccounts, StellarSignature, UR, URType } from '@keystonehq/keystone-sdk';
import { CameraError, getAnimatedScan, Purpose } from '@keystonehq/animated-qr-base';
import {
  KeystoneXdrSignerComponent
} from '~root/shared/shared-modals/components/keystone-xdr-signer/keystone-xdr-signer.component';

@Injectable({
  providedIn: 'root'
})
export class AirgappedWalletService {
  get codeReader(): BrowserQRCodeReader {
    const hint = new Map();
    hint.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    return new BrowserQRCodeReader(hint, {
      delayBetweenScanAttempts: 50,
      delayBetweenScanSuccess: 100,
    });
  }

  constructor(
    @Inject(DOCUMENT)
    private readonly doc: Document,
    private readonly nzModalService: NzModalService,
  ) { }

  decodeSignature(text: string): string {
    const parts = text.split(';');
    if (parts[0] !== 'signature') {
      throw new Error('Invalid QR type');
    }

    return parts[1];
  }

  decodeAddress(text: string): IDecodedAddress {
    const parts = text.split(';');
    const protocol = parts[0];

    if (protocol !== 'address') {
      throw new Error('Invalid QR type');
    }

    const path = parts[1];
    const publicKey = parts[2];

    if (!StrKey.isValidEd25519PublicKey(publicKey)) {
      throw new Error('Public key is invalid');
    }

    return {
      path,
      publicKey,
    };
  }

  requestAddress(params: {
    path: string;
  }): Promise<{ address: string; }> {
    return new Promise<{ address: string }>((resolve, reject) => {
      const modal = this.nzModalService.create({
        nzTitle: '',
        nzContent: AirgappedPublicKeyComponent,
        nzFooter: null,
        nzOnCancel: _ => {
          reject(new Error('Process rejected or closed'));
        },
        nzData: {
          path: params.path,
          requestResultHandler: (address: string) => {
            resolve({ address });
            modal.close();
          }
        }
      });
    });
  }

  signTransaction(params: {
    xdr: string;
    path: string;
    network: string;
  }): Promise<{ signature: string; }> {
    return new Promise<{signature: string}>((resolve, reject) => {
      const modal = this.nzModalService.create({
        nzTitle: '',
        nzContent: AirgappedXdrSignerComponent,
        nzFooter: null,
        nzOnCancel: _ => {
          reject(new Error('Transaction rejected or closed'));
        },
        nzData: {
          xdr: params.xdr,
          network: params.network,
          path: params.path,
          signatureResultHandler: (signature: string) => {
            resolve({ signature });
            modal.close();
          }
        }
      });
    });
  }

  async scanKeyStoneQRs(params: {
    videoElId: string;
    onProgress: (progress: number) => void;
    onSucceed: (result: { cbor: string; type: string; }) => void;
    onError: (err: Error) => void;
    urTypes: URType[]
  }): Promise<IScannerControls> {
    let scannerControls: IScannerControls;
    const videoEl: HTMLVideoElement | undefined = this.doc.getElementById(params.videoElId) as HTMLVideoElement | undefined;
    if (!videoEl) {
      throw new Error('Video Element doesn\'t exist');
    }

    const { handleScanFailure, handleScanSuccess } = getAnimatedScan({
      urTypes: params.urTypes,
      purpose: Purpose.SYNC,
      onProgress: (progress: number) => params.onProgress && params.onProgress(progress),
      handleError: (error: string) => {
        scannerControls.stop();
        params.onError(new Error(error));
      },
      handleScan: ({ cbor, type }) => {
        scannerControls.stop();
        params.onSucceed({ cbor, type });
      },
      videoLoaded: (canPlay: boolean, error: CameraError | undefined) => {
        if (!canPlay || !!error) {
          throw new Error('Video was not loaded or it can not be showed, make sure you have a camera and has given permissions to the wallet to use it.');
        }
      },
    });

    scannerControls = await this.codeReader.decodeFromVideoDevice(undefined, videoEl, (result, error) => {
      if (result) {
        handleScanSuccess(result.getText());
      } else if (error) {
        handleScanFailure(error.message);
      }
    });

    return scannerControls;
  }

  async scanKeystoneAccounts(params: {
    videoElId: string;
    onProgress?: (progress: number) => void;
    onSucceed: (result: { accounts: MultiAccounts }) => void;
    onError: (err: Error) => void;
  }): Promise<IScannerControls> {
    const keystoneSDK: KeystoneSDK = new KeystoneSDK();

    const videoEl: HTMLVideoElement | undefined = this.doc.getElementById(params.videoElId) as HTMLVideoElement | undefined;
    if (!videoEl) {
      throw new Error('Video Element doesn\'t exist');
    }

    return this.scanKeyStoneQRs({
      urTypes: [URType.CryptoMultiAccounts],
      videoElId: params.videoElId,
      onSucceed: (result: { cbor: string; type: string; }) => {
        const accounts: MultiAccounts = keystoneSDK.parseMultiAccounts(new UR(Buffer.from(result.cbor, 'hex'), result.type));
        params.onSucceed({ accounts });
      },
      onError: params.onError.bind(this),
      onProgress: (progress: number) => params.onProgress && params.onProgress(progress),
    });
  }

  async scanKeyStoneSignature(params: {
    videoElId: string;
    onProgress?: (progress: number) => void;
    onSucceed: (result: StellarSignature) => void;
    onError: (err: Error) => void;
  }): Promise<IScannerControls> {
    const keystoneSDK: KeystoneSDK = new KeystoneSDK();

    const videoEl: HTMLVideoElement | undefined = this.doc.getElementById(params.videoElId) as HTMLVideoElement | undefined;
    if (!videoEl) {
      throw new Error('Video Element doesn\'t exist');
    }

    return this.scanKeyStoneQRs({
      urTypes: [URType.StellarSignature],
      videoElId: params.videoElId,
      onSucceed: (result: { cbor: string; type: string; }) => {
        const stellarSignature: StellarSignature = keystoneSDK.stellar.parseSignature(
          new UR(Buffer.from(result.cbor, 'hex'), result.type)
        );

        params.onSucceed(stellarSignature);
      },
      onError: params.onError.bind(this),
      onProgress: (progress: number) => params.onProgress && params.onProgress(progress),
    });
  }

  async signWithKeystone(params: {
    path: string;
    deviceId: string;
    tx: Transaction | FeeBumpTransaction | Buffer;
  }): Promise<{ signature: string }> {
    return new Promise<{signature: string}>((resolve, reject) => {
      const modal = this.nzModalService.create({
        nzTitle: '',
        nzContent: KeystoneXdrSignerComponent,
        nzFooter: null,
        nzOnCancel: _ => {
          reject(new Error('Transaction rejected or closed'));
        },
        nzData: {
          tx: params.tx,
          path: params.path,
          deviceId: params.deviceId,
          signatureResultHandler: (signature: string) => {
            resolve({
              signature: Buffer.from(signature, 'hex').toString('base64')
            });
            modal.close();
          }
        }
      });
    });
  }
}

export interface IDecodedAddress {
  publicKey: string;
  path: string;
}
