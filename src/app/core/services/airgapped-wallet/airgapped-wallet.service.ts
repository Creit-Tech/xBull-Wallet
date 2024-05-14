import { Injectable } from '@angular/core';
import { StrKey } from 'stellar-sdk';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  AirgappedXdrSignerComponent
} from '~root/shared/shared-modals/components/airgapped-xdr-signer/airgapped-xdr-signer.component';
import {
  AirgappedPublicKeyComponent
} from '~root/shared/shared-modals/components/airgapped-public-key/airgapped-public-key.component';

@Injectable({
  providedIn: 'root'
})
export class AirgappedWalletService {
  constructor(
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
}

export interface IDecodedAddress {
  publicKey: string;
  path: string;
}
