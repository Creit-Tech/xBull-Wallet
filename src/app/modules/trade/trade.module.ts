import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TradeRoutingModule } from './trade-routing.module';
import { OfferComponent } from './pages/offer/offer.component';
import { LimitComponent } from './pages/limit/limit.component';
import { TradeComponent } from '~root/modules/trade/trade.component';
import { SegmentModule } from '~root/shared/segment/segment.module';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { SwapComponent } from './pages/swap/swap.component';
import { LoadingModule } from '~root/shared/loading/loading.module';
import {NzButtonModule} from "ng-zorro-antd/button";


@NgModule({
  declarations: [
    TradeComponent,
    OfferComponent,
    LimitComponent,
    SwapComponent
  ],
    imports: [
        CommonModule,
        TradeRoutingModule,
        SegmentModule,
        FormsComponentsModule,
        LoadingModule,
        NzButtonModule,
    ],
})
export class TradeModule { }
