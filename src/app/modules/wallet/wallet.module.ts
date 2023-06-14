import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletRoutingModule } from './wallet-routing.module';
import { SegmentModule } from '~root/shared/segment/segment.module';
import { ModalsModule } from '~root/shared/shared-modals/modals.module';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { AssetDetailsComponent } from './components/asset-details/asset-details.component';
import { LoadingModule } from '~root/shared/loading/loading.module';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { NgxMaskModule } from 'ngx-mask';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';
import { LiquidityPoolsModule } from '~root/modules/liquidity-pools/liquidity-pools.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { WalletDashboardComponent } from './pages/wallet-dashboard/wallet-dashboard.component';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { WalletAssetItemComponent } from './components/wallet-asset-item/wallet-asset-item.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SendPaymentComponent } from './pages/send-payment/send-payment.component';
import { ReceivePaymentComponent } from './pages/receive-payment/receive-payment.component';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { TranslationModule } from '~root/translation.module';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { SharedComponentsModule } from '~root/shared/shared-components/shared-components.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';


@NgModule({
  declarations: [
    AssetDetailsComponent,
    WalletDashboardComponent,
    WalletAssetItemComponent,
    SendPaymentComponent,
    ReceivePaymentComponent,
  ],
  imports: [
    CommonModule,
    WalletRoutingModule,
    SegmentModule,
    FormsComponentsModule,
    LoadingModule,
    ClipboardModule,
    SharedPipesModule,
    ModalsModule,
    NzImageModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzDrawerModule,
    NgxMaskModule,
    NzAutocompleteModule,
    NzSelectModule,
    NzSpinModule,
    NzModalModule,
    LiquidityPoolsModule,
    NzListModule,
    ScrollingModule,
    NzCardModule,
    NzTableModule,
    NzDropDownModule,
    NzBreadCrumbModule,
    NgxChartsModule,
    NzRadioModule,
    NzEmptyModule,
    TranslationModule.forChild(),
    NzDividerModule,
    NzTabsModule,
    SharedComponentsModule,
    NzToolTipModule,
  ],
})
export class WalletModule { }
