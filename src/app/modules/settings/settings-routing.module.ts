import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from '~root/modules/settings/settings.component';
import { AccountsComponent } from '~root/modules/settings/pages/accounts/accounts.component';
import { RegisteredWalletsComponent } from '~root/modules/settings/pages/registered-wallets/registered-wallets.component';
import { RegisteredWalletDetailsComponent } from '~root/modules/settings/pages/registered-wallet-details/registered-wallet-details.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: SettingsComponent,
  },
  {
    path: 'wallets',
    component: RegisteredWalletsComponent,
  },
  {
    path: 'wallets/:walletId',
    component: RegisteredWalletDetailsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
