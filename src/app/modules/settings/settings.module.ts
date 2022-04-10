import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { DefaultFeeFormComponent } from './components/default-fee-form/default-fee-form.component';
import { LoadingModule } from '~root/shared/loading/loading.module';
import { HorizonApisComponent } from './pages/horizon-apis/horizon-apis.component';
import { RegisteredWalletsComponent } from './pages/registered-wallets/registered-wallets.component';
import { RegisteredWalletDetailsComponent } from './pages/registered-wallet-details/registered-wallet-details.component';
import { EditWalletNameComponent } from './components/edit-wallet-name/edit-wallet-name.component';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { HorizonApiDetailsComponent } from './components/horizon-api-details/horizon-api-details.component';
import { AddHorizonApiComponent } from './components/add-horizon-api/add-horizon-api.component';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { AddAccountComponent } from './components/add-account/add-account.component';
import { SitesConnectedComponent } from './pages/sites-connected/sites-connected.component';
import { ConnectedSiteDetailsComponent } from './components/connected-site-details/connected-site-details.component';
import { AboutComponent } from './pages/about/about.component';
import { ActiveOperationsTypesComponent } from './pages/active-operations-types/active-operations-types.component';
import { AntiSpamOptionsComponent } from './pages/anti-spam/anti-spam-options/anti-spam-options.component';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzBreadCrumbModule} from 'ng-zorro-antd/breadcrumb';
import { AntiSpamKeysComponent } from './pages/anti-spam/anti-spam-keys/anti-spam-keys.component';
import {NzEmptyModule} from 'ng-zorro-antd/empty';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzInputModule} from 'ng-zorro-antd/input';
import {ClipboardModule} from '~root/shared/clipboard/clipboard.module';
import {NzPopconfirmModule} from 'ng-zorro-antd/popconfirm';
import {NzInputNumberModule} from 'ng-zorro-antd/input-number';
import {NzTableModule} from 'ng-zorro-antd/table';
import {NzDividerModule} from 'ng-zorro-antd/divider';
import { AntiSpamClaimableAssetsComponent } from './pages/anti-spam/anti-spam-claimable-assets/anti-spam-claimable-assets.component';
import {NzMessageModule} from 'ng-zorro-antd/message';
import { LockingComponent } from './pages/locking/locking.component';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgxMaskModule } from 'ngx-mask';
import { BackgroundImageComponent } from './pages/background-image/background-image.component';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { WalletAccountComponent } from './pages/wallet-account/wallet-account.component';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';


@NgModule({
  declarations: [
    SettingsComponent,
    DefaultFeeFormComponent,
    HorizonApisComponent,
    RegisteredWalletsComponent,
    RegisteredWalletDetailsComponent,
    EditWalletNameComponent,
    HorizonApiDetailsComponent,
    AddHorizonApiComponent,
    AddAccountComponent,
    SitesConnectedComponent,
    ConnectedSiteDetailsComponent,
    AboutComponent,
    ActiveOperationsTypesComponent,
    AntiSpamOptionsComponent,
    AntiSpamKeysComponent,
    AntiSpamClaimableAssetsComponent,
    LockingComponent,
    BackgroundImageComponent,
    WalletAccountComponent
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    FormsComponentsModule,
    LoadingModule,
    ModalsModule,
    SharedPipesModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzEmptyModule,
    NzFormModule,
    NzInputModule,
    ClipboardModule,
    NzPopconfirmModule,
    NzInputNumberModule,
    NzTableModule,
    NzDividerModule,
    NzMessageModule,
    NzSwitchModule,
    NzSelectModule,
    NzSpinModule,
    NgxMaskModule,
    NzSliderModule,
    NzCardModule,
    NzToolTipModule,
  ],
})
export class SettingsModule { }
