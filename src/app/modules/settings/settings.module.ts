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
import { WalletsAccountsComponent } from './pages/wallets-accounts/wallets-accounts.component';
import { HorizonApiDetailsComponent } from './components/horizon-api-details/horizon-api-details.component';
import { AddHorizonApiComponent } from './components/add-horizon-api/add-horizon-api.component';


@NgModule({
  declarations: [
    SettingsComponent,
    DefaultFeeFormComponent,
    HorizonApisComponent,
    RegisteredWalletsComponent,
    RegisteredWalletDetailsComponent,
    EditWalletNameComponent,
    WalletsAccountsComponent,
    HorizonApiDetailsComponent,
    AddHorizonApiComponent
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    FormsComponentsModule,
    LoadingModule,
    ModalsModule,
  ],
})
export class SettingsModule { }
