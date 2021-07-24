import { Injectable } from '@angular/core';
import { createHmac } from 'crypto';
type Hex = string;

type Keys = {
  key: Buffer;
  chainCode: Buffer;
};

@Injectable({
  providedIn: 'root'
})
export class HdWalletService {
  private ED25519_CURVE = 'ed25519 seed';
  private HARDENED_OFFSET = 0x80000000;

  getMasterKeyFromSeed(seed: Hex): Keys {
    const hmac = createHmac('sha512', this.ED25519_CURVE);
    const hmacResult = hmac.update(Buffer.from(seed, 'hex')).digest();
    return {
      key: hmacResult.slice(0, 32),
      chainCode: hmacResult.slice(32),
    };
  }

  // @ts-ignore
  CKDPriv({ key, chainCode }, index): Keys {
    const indexBuffer = Buffer.allocUnsafe(4);
    indexBuffer.writeUInt32BE(index, 0);
    const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer]);
    const I = createHmac('sha512', chainCode)
      .update(data)
      .digest();
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    return {
      key: IL,
      chainCode: IR,
    };
  }

  derivePath(path: string, seed: Hex): Keys {
    if (!this.isValidPath(path)) {
      throw new Error('Invalid derivation path');
    }
    const { key, chainCode } = this.getMasterKeyFromSeed(seed);
    const segments = path
      .split('/')
      .slice(1)
      .map(this.replaceDerive)
      .map(el => parseInt(el, 10));

    return segments.reduce(
      (parentKeys, segment) => this.CKDPriv(parentKeys, segment + this.HARDENED_OFFSET),
      { key, chainCode }
    );
  }

  isValidPath(path: string): boolean {
    const pathRegex = new RegExp(`^m(\\/[0-9]+')+$`);

    if (!pathRegex.test(path)) {
      return false;
    }
    return !path
      .split('/')
      .slice(1)
      .map(this.replaceDerive)
      .some(isNaN as any);
  }

  replaceDerive(val: string): string {
    return val.replace(`'`, '');
  }

}
