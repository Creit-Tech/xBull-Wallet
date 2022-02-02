import {ModuleWithProviders, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrScannerService } from '~root/mobile/services/qr-scanner.service';
import { QRScanner } from '@ionic-native/qr-scanner/ngx';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { CloseScanComponent } from './components/close-scan/close-scan.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { DeviceAuthService } from '~root/mobile/services/device-auth.service';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth/ngx';
import { TouchID } from '@awesome-cordova-plugins/touch-id';
import { Keychain } from '@awesome-cordova-plugins/keychain';
import { IosBlockPageComponent } from '~root/mobile/components/ios-block-page/ios-block-page.component';
import { NzCardModule } from 'ng-zorro-antd/card';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    CloseScanComponent,
    IosBlockPageComponent,
  ],
  imports: [
    CommonModule,
    NzDrawerModule,
    NzButtonModule,
    NzCardModule,
    RouterModule,
  ],
  exports: [
    IosBlockPageComponent,
  ]
})
export class MobileModule {
  static forRoot(): ModuleWithProviders<MobileModule> {
    return {
      ngModule: MobileModule,
      providers: [
        QrScannerService,
        QRScanner,
        DeviceAuthService,
        AndroidFingerprintAuth,
        {
          provide: 'TouchID',
          useValue: TouchID,
        },
        {
          provide: 'Keychain',
          useValue: Keychain,
        },
      ],
    };
  }
}
