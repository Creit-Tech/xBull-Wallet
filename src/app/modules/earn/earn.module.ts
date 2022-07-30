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
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { EarnAuthenticationComponent } from './pages/earn-authentication/earn-authentication.component';
import { SharedComponentsModule } from '~root/shared/shared-components/shared-components.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  EarnInvalidTokenInterceptor
} from '~root/modules/earn/interceptors/earn-invalid-token.interceptor';
import { EarnStrategiesService } from '~root/modules/earn/services/earn-strategies.service';
import { EarnAuthenticatedGuard } from '~root/modules/earn/guards/earn-authenticated.guard';
import { EarnStrategiesStore } from '~root/modules/earn/state/strategies/earn-strategies.store';
import { EarnStrategiesQuery } from '~root/modules/earn/state/strategies/earn-strategies.query';
import { EarnAuthTokenInterceptor } from '~root/modules/earn/interceptors/earn-auth-token.interceptor';
import { EarnVaultsQuery } from '~root/modules/earn/state/vaults/earn-vaults.query';
import { EarnVaultsService } from '~root/modules/earn/state/vaults/earn-vaults.service';
import { EarnVaultsStore } from '~root/modules/earn/state/vaults/earn-vaults.store';
import { NzTableModule } from 'ng-zorro-antd/table';
import { EarnTokensStore } from '~root/modules/earn/state/tokens/earn-tokens.store';
import { EarnTokensService } from '~root/modules/earn/state/tokens/earn-tokens.service';
import { EarnTokensQuery } from '~root/modules/earn/state/tokens/earn-tokens.query';


@NgModule({
  declarations: [
    EarnDashboardComponent,
    EarnProductCardComponent,
    StrategyDetailsComponent,
    DepositVaultFundsComponent,
    WithdrawVaultFundsComponent,
    EarnAuthenticationComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
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
    SharedPipesModule,
    ReactiveFormsModule,
    NgxMaskModule,
    NzInputNumberModule,
    SharedComponentsModule,
    NzTableModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EarnInvalidTokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EarnAuthTokenInterceptor,
      multi: true,
    },
    EarnTokensStore,
    EarnTokensService,
    EarnTokensQuery,
    EarnVaultsQuery,
    EarnVaultsService,
    EarnVaultsStore,
    EarnStrategiesService,
    EarnStrategiesStore,
    EarnStrategiesQuery,
    EarnAuthenticatedGuard,
  ]
})
export class EarnModule { }
