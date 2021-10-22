import {ModuleWithProviders, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrScannerService } from '~root/mobile/services/qr-scanner.service';
import { QRScanner } from '@ionic-native/qr-scanner/ngx';
import {NzDrawerModule} from "ng-zorro-antd/drawer";
import { CloseScanComponent } from './components/close-scan/close-scan.component';
import {NzButtonModule} from "ng-zorro-antd/button";



@NgModule({
  declarations: [
    CloseScanComponent
  ],
    imports: [
        CommonModule,
        NzDrawerModule,
        NzButtonModule,
    ],
  providers: [
  ],
})
export class MobileModule {
  static forRoot(): ModuleWithProviders<MobileModule> {
    return {
      ngModule: MobileModule,
      providers: [
        QrScannerService,
        QRScanner,
      ],
    };
  }
}
