import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { LiquidityPoolsRoutingModule } from './liquidity-pools-routing.module';
import { LiquidityPoolsOverviewComponent } from './pages/liquidity-pools-overview/liquidity-pools-overview.component';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { LpAssetItemComponent } from '~root/modules/liquidity-pools/components/lp-asset-item/lp-asset-item.component';
import { LpAssetDetailsComponent } from '~root/modules/liquidity-pools/components/lp-asset-details/lp-asset-details.component';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ReactiveFormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NgxMaskModule } from 'ngx-mask';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { DepositLiquidityComponent } from './components/deposit-liquidity/deposit-liquidity.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { WithdrawLiquidityComponent } from './components/withdraw-liquidity/withdraw-liquidity.component';
import { NzSliderModule } from 'ng-zorro-antd/slider';


@NgModule({
  declarations: [
    LiquidityPoolsOverviewComponent,
    LpAssetItemComponent,
    LpAssetDetailsComponent,
    DepositLiquidityComponent,
    WithdrawLiquidityComponent,
  ],
  exports: [
    LpAssetItemComponent,
    LpAssetDetailsComponent,
  ],
  imports: [
    CommonModule,
    LiquidityPoolsRoutingModule,
    NzBreadCrumbModule,
    NzIconModule,
    NzTabsModule,
    NzCardModule,
    NzListModule,
    SharedPipesModule,
    ClipboardModule,
    NzButtonModule,
    NzSelectModule,
    ReactiveFormsModule,
    NzInputModule,
    NgxMaskModule,
    NzTagModule,
    NzEmptyModule,
    NzBadgeModule,
    NzRadioModule,
    NzFormModule,
    NzSpinModule,
    NzSliderModule,
  ],
})
export class LiquidityPoolsModule { }
