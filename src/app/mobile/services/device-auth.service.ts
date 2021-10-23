import { Injectable } from '@angular/core';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';
import { Platform } from '@ionic/angular';
import { randomBytes } from 'crypto';

export const PASSWORD_IDENTIFIER = 'PASSWORD_IDENTIFIER';

@Injectable()
export class DeviceAuthService {

  constructor(
    private androidFingerprintAuth: AndroidFingerprintAuth,
    private platform: Platform,
  ) { }

  async encryptWithDevice(text: string, identifier: string): Promise<{ token: string; identifier: string }> {
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

    throw new Error('Platform not supported');
  }

  async decryptWithDevice(token: string, identifier: string): Promise<string> {

    if (this.platform.is('android')) {
      const results = await this.androidFingerprintAuth.isAvailable();
      if (results.isAvailable) {
        try {
          const result = await this.androidFingerprintAuth.decrypt({
            clientId: identifier,
            token,
          });

          return result.password;
        } catch (e) {
          throw new Error(`Unauthorized, try again or contact support.`);
        }
      } else {
        throw new Error('Device auth method or password required to continue');
      }
    }

    throw new Error('Platform not supported');
  }


}
