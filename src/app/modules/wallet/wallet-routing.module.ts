import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WalletAssetsComponent } from '~root/modules/wallet/pages/wallet-assets/wallet-assets.component';
import { WalletComponent } from '~root/modules/wallet/wallet.component';
import { WalletOffersComponent } from '~root/modules/wallet/pages/wallet-offers/wallet-offers.component';
import { WalletTransactionsComponent } from '~root/modules/wallet/pages/wallet-transactions/wallet-transactions.component';
import { WalletDashboardComponent } from '~root/modules/wallet/pages/wallet-dashboard/wallet-dashboard.component';
import { SendPaymentComponent } from '~root/modules/wallet/pages/send-payment/send-payment.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: WalletDashboardComponent,
  },
  {
    path: 'payment',
    component: SendPaymentComponent,
  },
  {
    path: '',
    component: WalletComponent,
    children: [
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
