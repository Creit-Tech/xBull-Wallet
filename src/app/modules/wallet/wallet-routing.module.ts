import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WalletDashboardComponent } from '~root/modules/wallet/pages/wallet-dashboard/wallet-dashboard.component';
import { SendPaymentComponent } from '~root/modules/wallet/pages/send-payment/send-payment.component';
import { ReceivePaymentComponent } from '~root/modules/wallet/pages/receive-payment/receive-payment.component';

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
    path: 'receive',
    component: ReceivePaymentComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
