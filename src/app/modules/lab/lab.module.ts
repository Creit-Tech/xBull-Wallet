import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LabRoutingModule } from './lab-routing.module';
import { LabComponent } from './lab.component';
import { ImportXdrComponent } from './pages/import-xdr/import-xdr.component';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { ClaimClaimableBalanceComponent } from './pages/claim-claimable-balance/claim-claimable-balance.component';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { ClaimableBalanceDetailsComponent } from './components/claimable-balance-details/claimable-balance-details.component';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { LoadingModule } from '~root/shared/loading/loading.module';
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzInputModule} from "ng-zorro-antd/input";
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';


@NgModule({
  declarations: [
    LabComponent,
    ImportXdrComponent,
    ClaimClaimableBalanceComponent,
    ClaimableBalanceDetailsComponent
  ],
  imports: [
    CommonModule,
    LabRoutingModule,
    FormsComponentsModule,
    ClipboardModule,
    SharedPipesModule,
    ModalsModule,
    LoadingModule,
    NzButtonModule,
    NzInputModule,
    NzBreadCrumbModule,
  ],
})
export class LabModule { }
