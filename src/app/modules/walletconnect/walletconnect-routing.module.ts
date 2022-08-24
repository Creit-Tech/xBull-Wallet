import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  WalletConnectDashboardComponent
} from '~root/modules/walletconnect/pages/walletconnect-dashboard/walletconnect-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: WalletConnectDashboardComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletconnectRoutingModule { }
