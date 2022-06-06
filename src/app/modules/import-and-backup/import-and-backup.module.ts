import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImportAndBackupRoutingModule } from './import-and-backup-routing.module';
import { ImportAndBackupSelectionComponent } from './pages/import-and-backup-selection/import-and-backup-selection.component';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ExportWalletComponent } from './components/export-wallet/export-wallet.component';
import { ImportWalletComponent } from './components/import-wallet/import-wallet.component';
import { NgxFileDropModule } from 'ngx-file-drop';
import { TranslationModule } from '~root/translation.module';


import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';


@NgModule({
  declarations: [
    ImportAndBackupSelectionComponent,
    ExportWalletComponent,
    ImportWalletComponent
  ],
  providers: [
    SocialSharing
  ],
  imports: [
    CommonModule,
    ImportAndBackupRoutingModule,
    NzCardModule,
    NzButtonModule,
    NzTabsModule,
    NgxFileDropModule,
    TranslationModule.forChild(),
  ]
})
export class ImportAndBackupModule { }
