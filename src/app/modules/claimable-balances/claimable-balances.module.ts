import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClaimableBalancesRoutingModule } from './claimable-balances-routing.module';
import { ClaimableBalancesDashboardComponent } from './pages/claimable-balances-dashboard/claimable-balances-dashboard.component';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzListModule } from 'ng-zorro-antd/list';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { ClaimableBalanceDetailsComponent } from './components/claimable-balance-details/claimable-balance-details.component';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { TranslationModule } from '~root/translation.module';


@NgModule({
  declarations: [
    ClaimableBalancesDashboardComponent,
    ClaimableBalanceDetailsComponent
  ],
  imports: [
    CommonModule,
    ClaimableBalancesRoutingModule,
    NzBreadCrumbModule,
    NzListModule,
    SharedPipesModule,
    NzImageModule,
    NzButtonModule,
    ClipboardModule,
    NzSpinModule,
    NzEmptyModule,
    TranslationModule.forChild(),
  ]
})
export class ClaimableBalancesModule { }
