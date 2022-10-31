import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { IsThereWalletsGuard } from '~root/core/wallets/guards/is-there-wallets.guard';
import { LabComponent } from '~root/modules/lab/lab.component';
import {BackgroundComponent} from "~root/modules/background/background.component";
import {environment} from "~env";
import { IosViewRestrictionGuard } from '~root/core/guards/ios-view-restriction.guard';
import { IosBlockPageComponent } from '~root/mobile/components/ios-block-page/ios-block-page.component';
import { MainLayoutV1Component } from '~root/core/layouts/main-layout-v1/main-layout-v1.component';

const routes: Routes = [
  {
    path: 'create-account',
    loadChildren: () => import('./modules/generate-account/generate-account.module')
      .then(m => m.GenerateAccountModule),
  },
  {
    path: 'sign-from-background',
    component: BackgroundComponent,
  },
  {
    path: 'ios-block-message',
    component: IosBlockPageComponent
  },
  {
    path: 'connect',
    loadChildren: () => import('./modules/connect/connect.module')
      .then(m => m.ConnectModule)
  },
  {
    path: '',
    component: MainLayoutV1Component,
    canActivate: [
      IsThereWalletsGuard
    ],
    canActivateChild: [
      IsThereWalletsGuard
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'wallet'
      },
      {
        path: 'wallet',
        loadChildren: () => import('./modules/wallet/wallet.module')
          .then(m => m.WalletModule),
      },
      {
        path: 'operations',
        loadChildren: () => import('./modules/operations/operations.module')
          .then(m => m.OperationsModule)
      },
      {
        path: 'gift-cards',
        loadChildren: () => import('./modules/gift-cards/gift-cards.module')
          .then(m => m.GiftCardsModule)
      },
      {
        path: 'airtime',
        loadChildren: () => import('./modules/airtime/airtime.module')
          .then(m => m.AirtimeModule)
      },
      {
        path: 'swaps',
        loadChildren: () => import('./modules/swaps/swaps.module')
          .then(m => m.SwapsModule),
      },
      {
        path: 'earn',
        loadChildren: () => import('./modules/earn/earn.module')
          .then(m => m.EarnModule),
      },
      {
        path: 'liquidity-pools',
        loadChildren: () => import('./modules/liquidity-pools/liquidity-pools.module')
          .then(m => m.LiquidityPoolsModule)
      },
      {
        path: 'airdrops',
        loadChildren: () => import('./modules/claimable-balances/claimable-balances.module')
          .then(m => m.ClaimableBalancesModule)
      },
      {
        path: 'lab',
        loadChildren: () => import('./modules/lab/lab.module')
          .then(m => m.LabModule)
      },
      {
        path: 'walletconnect',
        loadChildren: () => import('./modules/walletconnect/walletconnect.module')
          .then(m => m.WalletconnectModule)
      },
      {
        path: 'anchors',
        loadChildren: () => import('./modules/anchors/anchors.module')
          .then(m => m.AnchorsModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./modules/settings/settings.module')
          .then(m => m.SettingsModule)
      },
    ]
  },
  {
    path: '**',
    redirectTo: '/wallet',
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: environment.platform !== 'website',
    preloadingStrategy: PreloadAllModules,
    // enableTracing: !environment.production
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
