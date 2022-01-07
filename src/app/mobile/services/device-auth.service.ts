import { Inject, Injectable } from '@angular/core';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';
import { Platform } from '@ionic/angular';
import { randomBytes } from 'crypto';
import { TouchID } from '@awesome-cordova-plugins/touch-id';
import { Keychain } from '@awesome-cordova-plugins/keychain';


export const PASSWORD_IDENTIFIER = 'PASSWORD_IDENTIFIER';

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

  async encryptWithDevice(text: string, identifier: string): Promise<{ token?: string; identifier: string }> {
    if (this.platform.is('android')) {
      const results = await this.androidFingerprintAuth.isAvailable();
      if (results.isAvailable) {
        try {
          const result = await this.androidFingerprintAuth.encrypt({
            clientId: identifier,
            password: text,
            disableBackup: true,
            dialogTitle: 'Auth with device',
          });

          return {
            token: result.token,
            identifier
          };
        } catch (e) {
          throw new Error(`We were not able to encrypt with the device, try again or contact support.`);
        }
      } else {
        throw new Error('Device auth method or password required to continue');
      }
    }

    else if (this.platform.is('ios')) {
      try {
        await this.touchId.isAvailable();
      } catch (e) {
        console.error(e);
        throw new Error(`Touch/Face ID is not available.`);
      }

      try {
        await this.touchId.verifyFingerprint('Scan your fingerprint/face please');
      } catch (e) {
        console.error(e);
        throw new Error(`Authentication failed`);
      }

      try {
        await this.keychain.set(identifier, text, true);
      } catch (e) {
        console.error(e);
        throw new Error(`We couldn't save the value in the secured storage`);
      }

      return {
        identifier
      };
    }

    throw new Error('Platform not supported');
  }

  async decryptWithDevice(params: { token?: string, identifier: string }): Promise<string> {

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

          return result.password;
        } catch (e) {
          throw new Error(`Unauthorized, try again or contact support.`);
        }
      } else {
        throw new Error('Device auth method or password is not available');
      }
    }

    else if (this.platform.is('ios')) {
      try {
        return this.keychain.get(params.identifier, 'Confirm with Touch/Face ID to continue');
      } catch (e) {
        console.error(e);
        throw new Error(`We couldn't get the key from the secured storage.`);
      }
    }

    throw new Error('Platform not supported');
  }


}
