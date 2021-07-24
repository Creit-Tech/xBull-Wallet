import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WalletAssetsComponent } from '~root/modules/wallet/pages/wallet-assets/wallet-assets.component';
import { WalletComponent } from '~root/modules/wallet/wallet.component';
import { WalletOffersComponent } from '~root/modules/wallet/pages/wallet-offers/wallet-offers.component';
import { WalletTransactionsComponent } from '~root/modules/wallet/pages/wallet-transactions/wallet-transactions.component';

const routes: Routes = [
  {
    path: '',
    component: WalletComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/wallet/assets',
      },
      {
        path: 'assets',
        component: WalletAssetsComponent,
      },
      {
        path: 'offers',
        component: WalletOffersComponent,
      },
      {
        path: 'transactions',
        component: WalletTransactionsComponent,
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
