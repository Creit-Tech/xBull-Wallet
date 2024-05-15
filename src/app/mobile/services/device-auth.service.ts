import { Injectable } from '@angular/core';
import { randomBytes } from 'crypto';
import { AES, enc } from 'crypto-js';
import { BiometricAuth, BiometryErrorType } from '@aparajita/capacitor-biometric-auth';
import { DataType, SecureStorage } from '@aparajita/capacitor-secure-storage';

@Injectable()
export class DeviceAuthService {
  async isAvailable(): Promise<{ access: boolean; message?: BiometryErrorType }> {
    try {
      const result = await BiometricAuth.checkBiometry();
      return { access: result.isAvailable };
    } catch (e: unknown) {
      return { access: false, message: e as BiometryErrorType };
    }
  }

  async encryptWithDevice(text: string): Promise<{ identifier: string; key: string; }> {
    const identifier = randomBytes(32).toString('hex');
    const key = randomBytes(32).toString('hex');
    const encryptedText = AES.encrypt(text, key).toString();

    const { access } = await this.isAvailable();
    if (!access) {
      throw new Error('Device authentication not supported');
    }

    try {
      await BiometricAuth.authenticate({
        allowDeviceCredential: false,
      });
    } catch (e: any) {
      console.error(e.message);
      throw new Error(e.message);
    }

    try {
      await SecureStorage.set(
        identifier,
        encryptedText,
        false,
        false,
      );
    } catch (e: any) {
      console.error(e.message);
      throw new Error(e.message);
    }

    return {
      identifier,
      key,
    };
  }

  async decryptWithDevice(params: { identifier: string; key: string }): Promise<string> {
    const { access } = await this.isAvailable();
    if (!access) {
      throw new Error('Device authentication not supported');
    }

    try {
      await BiometricAuth.authenticate({
        allowDeviceCredential: false,
      });
    } catch (e: any) {
      console.error(e.message);
      throw new Error(e.message);
    }

    let encryptedText: DataType | null;
    try {
      encryptedText = await SecureStorage.get(
        params.identifier,
        false,
        false,
      );
      if (!encryptedText || typeof encryptedText !== 'string') {
        throw new Error('Device data identifier is invalid, please re-register your authentication device.');
      }
    } catch (e: any) {
      console.error(e.message);
      throw new Error(e.message);
    }

    return AES.decrypt(encryptedText, params.key).toString(enc.Utf8);
  }


}
