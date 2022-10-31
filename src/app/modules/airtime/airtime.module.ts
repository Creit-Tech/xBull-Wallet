import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AirtimeRoutingModule } from './airtime-routing.module';
import { MobileTopupComponent } from './pages/mobile-topup/mobile-topup.component';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ReactiveFormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { MobileTopupSummaryComponent } from './components/mobile-topup-summary/mobile-topup-summary.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';
import { TranslateModule } from '@ngx-translate/core';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { AirtimeOrdersComponent } from './components/airtime-orders/airtime-orders.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { AirtimeOrderDetailsComponent } from './components/airtime-order-details/airtime-order-details.component';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';


@NgModule({
  declarations: [
    MobileTopupComponent,
    MobileTopupSummaryComponent,
    AirtimeOrdersComponent,
    AirtimeOrderDetailsComponent
  ],
  imports: [
    CommonModule,
    AirtimeRoutingModule,
    NzBreadCrumbModule,
    NzSpinModule,
    NzCardModule,
    NzSelectModule,
    NzStepsModule,
    NzButtonModule,
    ReactiveFormsModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzListModule,
    TranslateModule,
    SharedPipesModule,
    NzCheckboxModule,
    NzDividerModule,
    ClipboardModule,
  ]
})
export class AirtimeModule { }
