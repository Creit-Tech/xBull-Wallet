import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LiquidityPoolsOverviewComponent } from '~root/modules/liquidity-pools/pages/liquidity-pools-overview/liquidity-pools-overview.component';

const routes: Routes = [
  {
    path: '',
    component: LiquidityPoolsOverviewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LiquidityPoolsRoutingModule { }
