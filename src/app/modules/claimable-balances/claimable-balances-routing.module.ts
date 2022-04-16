import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  ClaimableBalancesDashboardComponent
} from '~root/modules/claimable-balances/pages/claimable-balances-dashboard/claimable-balances-dashboard.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ClaimableBalancesDashboardComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClaimableBalancesRoutingModule { }
