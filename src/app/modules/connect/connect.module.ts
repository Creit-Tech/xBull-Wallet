import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConnectRoutingModule } from './connect-routing.module';
import { ConnectDashboardComponent } from './pages/connect-dashboard/connect-dashboard.component';
import { ConnectAccountComponent } from './components/connect-account/connect-account.component';
import { NzImageModule } from 'ng-zorro-antd/experimental/image';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ConnectQuery } from '~root/modules/connect/state/connect.query';
import { ConnectStore } from '~root/modules/connect/state/connect.store';
import { ConnectFlowService } from '~root/modules/connect/services/connect-flow.service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';


@NgModule({
  declarations: [
    ConnectDashboardComponent,
    ConnectAccountComponent
  ],
  imports: [
    CommonModule,
    ConnectRoutingModule,
    NzImageModule,
    NzButtonModule,
    NzListModule,
    NzStepsModule,
    NzCardModule,
    NzSelectModule,
    ReactiveFormsModule,
    SharedPipesModule,
    NzTreeSelectModule
  ],
  providers: [
    ConnectQuery,
    ConnectStore,
    ConnectFlowService,
  ]
})
export class ConnectModule { }
