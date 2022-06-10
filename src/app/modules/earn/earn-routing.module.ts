import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EarnDashboardComponent } from '~root/modules/earn/pages/earn-dashboard/earn-dashboard.component';
import { StrategyDetailsComponent } from '~root/modules/earn/pages/strategy-details/strategy-details.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: EarnDashboardComponent,
  },
  {
    path: 'strategies/:strategyId',
    component: StrategyDetailsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EarnRoutingModule { }
