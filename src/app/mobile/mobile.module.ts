import {ModuleWithProviders, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { DeviceAuthService } from '~root/mobile/services/device-auth.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NzDrawerModule,
    NzButtonModule,
    NzCardModule,
    RouterModule,
  ],
  exports: []
})
export class MobileModule {
  static forRoot(): ModuleWithProviders<MobileModule> {
    return {
      ngModule: MobileModule,
      providers: [
        DeviceAuthService,
      ],
    };
  }
}
