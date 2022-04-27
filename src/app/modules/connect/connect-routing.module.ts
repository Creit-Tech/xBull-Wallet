import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnectDashboardComponent } from '~root/modules/connect/pages/connect-dashboard/connect-dashboard.component';
import { ConnectNoWalletComponent } from '~root/modules/connect/pages/connect-no-wallet/connect-no-wallet.component';
import { CanAccessConnectGuard } from '~root/modules/connect/guards/can-access-connect.guard';

const routes: Routes = [
  {
    path: '',
    component: ConnectDashboardComponent,
    canActivate: [
      CanAccessConnectGuard,
    ],
  },
  {
    path: 'no-wallet',
    component: ConnectNoWalletComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConnectRoutingModule { }
