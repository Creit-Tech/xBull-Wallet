import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TradeComponent } from '~root/modules/trade/trade.component';
import { OfferComponent } from '~root/modules/trade/pages/offer/offer.component';
import { LimitComponent } from '~root/modules/trade/pages/limit/limit.component';
import { SwapComponent } from '~root/modules/trade/pages/swap/swap.component';

const routes: Routes = [
  {
    path: '',
    component: TradeComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/trade/offer'
      },
      {
        path: 'offer',
        component: OfferComponent,
      },
      {
        path: 'limit',
        component: LimitComponent,
      },
      {
        path: 'swap',
        component: SwapComponent,
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TradeRoutingModule { }
