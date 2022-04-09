import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { MainLayoutComponent } from '~root/core/layouts/main-layout/main-layout.component';
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
    path: 'trade',
    component: MainLayoutComponent,
    data: {
      activeIcon: 'trade'
    },
    canActivate: [
      IsThereWalletsGuard,
      IosViewRestrictionGuard
    ],
    canActivateChild: [
      IsThereWalletsGuard,
      IosViewRestrictionGuard
    ],
    loadChildren: () => import('./modules/trade/trade.module')
      .then(m => m.TradeModule)
  },
  {
    path: 'lab',
    component: MainLayoutComponent,
    data: {
      activeIcon: 'lab'
    },
    canActivate: [
      IsThereWalletsGuard
    ],
    canActivateChild: [
      IsThereWalletsGuard
    ],
    loadChildren: () => import('./modules/lab/lab.module')
      .then(m => m.LabModule)
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
        path: 'swaps',
        loadChildren: () => import('./modules/swaps/swaps.module')
          .then(m => m.SwapsModule),
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
