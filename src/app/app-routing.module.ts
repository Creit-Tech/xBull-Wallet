import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from '~root/core/layouts/main-layout/main-layout.component';
import { IsThereWalletsGuard } from '~root/core/wallets/guards/is-there-wallets.guard';

const routes: Routes = [
  {
    path: 'create-account',
    loadChildren: () => import('./modules/generate-account/generate-account.module')
      .then(m => m.GenerateAccountModule),
  },
  {
    path: 'wallet',
    component: MainLayoutComponent,
    data: {
      activeIcon: 'wallet'
    },
    canActivate: [
      IsThereWalletsGuard
    ],
    canActivateChild: [
      IsThereWalletsGuard
    ],
    loadChildren: () => import('./modules/wallet/wallet.module')
      .then(m => m.WalletModule)
  },
  {
    path: 'trade',
    component: MainLayoutComponent,
    data: {
      activeIcon: 'trade'
    },
    canActivate: [
      IsThereWalletsGuard
    ],
    canActivateChild: [
      IsThereWalletsGuard
    ],
    loadChildren: () => import('./modules/trade/trade.module')
      .then(m => m.TradeModule)
  },
  {
    path: 'settings',
    component: MainLayoutComponent,
    data: {
      activeIcon: 'settings'
    },
    canActivate: [
      IsThereWalletsGuard
    ],
    canActivateChild: [
      IsThereWalletsGuard
    ],
    loadChildren: () => import('./modules/settings/settings.module')
      .then(m => m.SettingsModule)
  },
  {
    path: '**', // TODO: update this once we have complete with the basic development of the welcome and dashboard
    redirectTo: 'settings',
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
