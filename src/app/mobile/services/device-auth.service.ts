import { Inject, Injectable } from '@angular/core';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';
import { Platform } from '@ionic/angular';
import { randomBytes } from 'crypto';
import { AES, enc } from 'crypto-js';
import { TouchID } from '@awesome-cordova-plugins/touch-id';
import { Keychain } from '@awesome-cordova-plugins/keychain';

@Injectable()
export class DeviceAuthService {

  constructor(
    private androidFingerprintAuth: AndroidFingerprintAuth,
    @Inject('TouchID')
    private touchId: typeof TouchID,
    @Inject('Keychain')
    private keychain: typeof Keychain,
    private platform: Platform,
  ) { }

  async encryptWithDevice(text: string): Promise<{ token?: string; identifier: string; key: string; }> {
    const identifier = 'xBull:' + randomBytes(32).toString('hex');
    const key = randomBytes(32).toString('hex');
    const encryptedText = AES.encrypt(text, key).toString();
    if (this.platform.is('android')) {
      const results = await this.androidFingerprintAuth.isAvailable();
      if (results.isAvailable) {
        try {
          const result = await this.androidFingerprintAuth.encrypt({
            clientId: identifier,
            password: encryptedText,
            disableBackup: true,
            dialogTitle: 'Auth with device',
          });

          return {
            token: result.token,
            identifier,
            key,
          };
        } catch (e: any) {
          throw new Error(`We were not able to encrypt with the device, try again or contact support.`);
        }
      } else {
        throw new Error('Device auth method or password required to continue');
      }
    }

    else if (this.platform.is('ios')) {
      try {
        await this.touchId.isAvailable();
      } catch (e: any) {
        console.error(e);
        throw new Error(`Touch/Face ID is not available.`);
      }

      try {
        await this.touchId.verifyFingerprint('Scan your fingerprint/face please');
      } catch (e: any) {
        console.error(e);
        throw new Error(`Authentication failed`);
      }

      try {
        await this.keychain.set(identifier, encryptedText, true);
      } catch (e: any) {
        console.error(e);
        throw new Error(`We couldn't save the value in the secured storage`);
      }

      return {
        identifier,
        key,
      };
    }

    throw new Error('Platform not supported');
  }

  async decryptWithDevice(params: { token?: string, identifier: string; key: string }): Promise<string> {
    if (this.platform.is('android')) {
      if (!params.token) {
        throw new Error(`Token is not available in the device, please reset the auth integration in the settings page`);
      }

      const results = await this.androidFingerprintAuth.isAvailable();
      if (results.isAvailable) {
        try {
          const result = await this.androidFingerprintAuth.decrypt({
            clientId: params.identifier,
            token: params.token,
          });

          return AES.decrypt(result.password, params.key).toString(enc.Utf8);
        } catch (e: any) {
          throw new Error(`Unauthorized, try again or contact support.`);
        }
      } else {
        throw new Error('Device auth method or password is not available');
      }
    }

    else if (this.platform.is('ios')) {
      try {
        return this.keychain.get(params.identifier, 'Confirm with Touch/Face ID to continue')
          .then(text => AES.decrypt(text, params.key).toString(enc.Utf8));
      } catch (e: any) {
        console.error(e);
        throw new Error(`We couldn't get the key from the secured storage.`);
      }
    }

    throw new Error('Platform not supported');
  }


}
