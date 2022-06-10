import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EarnRoutingModule } from './earn-routing.module';
import { EarnDashboardComponent } from './pages/earn-dashboard/earn-dashboard.component';
import { NzCardModule } from 'ng-zorro-antd/card';
import { EarnProductCardComponent } from './components/earn-product-card/earn-product-card.component';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { StrategyDetailsComponent } from './pages/strategy-details/strategy-details.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { AreaChartModule, LineChartModule } from '@swimlane/ngx-charts';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DepositVaultFundsComponent } from './components/deposit-vault-funds/deposit-vault-funds.component';
import { WithdrawVaultFundsComponent } from './components/withdraw-vault-funds/withdraw-vault-funds.component';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';


@NgModule({
  declarations: [
    EarnDashboardComponent,
    EarnProductCardComponent,
    StrategyDetailsComponent,
    DepositVaultFundsComponent,
    WithdrawVaultFundsComponent
  ],
  imports: [
    CommonModule,
    EarnRoutingModule,
    NzCardModule,
    NzAvatarModule,
    NzBreadCrumbModule,
    NzDividerModule,
    NzStatisticModule,
    LineChartModule,
    AreaChartModule,
    NzRadioModule,
    NzTabsModule,
    NzInputModule,
    NzButtonModule,
    SharedPipesModule
  ]
})
export class EarnModule { }
