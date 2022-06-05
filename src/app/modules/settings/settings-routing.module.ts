import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from '~root/modules/settings/settings.component';
import { RegisteredWalletsComponent } from '~root/modules/settings/pages/registered-wallets/registered-wallets.component';
import { RegisteredWalletDetailsComponent } from '~root/modules/settings/pages/registered-wallet-details/registered-wallet-details.component';
import { HorizonApisComponent } from '~root/modules/settings/pages/horizon-apis/horizon-apis.component';
import { SitesConnectedComponent } from '~root/modules/settings/pages/sites-connected/sites-connected.component';
import { AboutComponent } from '~root/modules/settings/pages/about/about.component';
import { ActiveOperationsTypesComponent } from '~root/modules/settings/pages/active-operations-types/active-operations-types.component';
import {AntiSpamOptionsComponent} from '~root/modules/settings/pages/anti-spam/anti-spam-options/anti-spam-options.component';
import {AntiSpamKeysComponent} from '~root/modules/settings/pages/anti-spam/anti-spam-keys/anti-spam-keys.component';
import {AntiSpamClaimableAssetsComponent} from '~root/modules/settings/pages/anti-spam/anti-spam-claimable-assets/anti-spam-claimable-assets.component';
import {LockingComponent} from '~root/modules/settings/pages/locking/locking.component';
import { BackgroundImageComponent } from '~root/modules/settings/pages/background-image/background-image.component';
import { WalletAccountComponent } from '~root/modules/settings/pages/wallet-account/wallet-account.component';

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
  },
  {
    path: 'wallets/:walletId/accounts/:publicKey',
    component: WalletAccountComponent,
  },
  {
    path: 'horizon-apis',
    component: HorizonApisComponent,
  },
  {
    path: 'active-operations-types',
    component: ActiveOperationsTypesComponent,
  },
  {
    path: 'sites-connected',
    component: SitesConnectedComponent,
  },
  {
    path: 'background-image',
    component: BackgroundImageComponent,
  },
  {
    path: 'locking',
    component: LockingComponent,
  },
  {
    path: 'anti-spam',
    component: AntiSpamOptionsComponent,
  },
  {
    path: 'anti-spam/public-keys',
    component: AntiSpamKeysComponent,
  },
  {
    path: 'anti-spam/claimable-assets',
    component: AntiSpamClaimableAssetsComponent,
  },
  {
    path: 'import-and-backup',
    loadChildren: () => import('../import-and-backup/import-and-backup.module')
      .then(m => m.ImportAndBackupModule)
  },
  {
    path: 'about',
    component: AboutComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
