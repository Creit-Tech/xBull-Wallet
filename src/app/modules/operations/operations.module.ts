import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OperationsRoutingModule } from './operations-routing.module';
import { OperationsDashboardComponent } from './pages/operations-dashboard/operations-dashboard.component';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { OperationItemComponent } from './components/operation-item/operation-item.component';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { OperationDetailsComponent } from './components/operation-details/operation-details.component';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';


@NgModule({
  declarations: [
    OperationsDashboardComponent,
    OperationItemComponent,
    OperationDetailsComponent
  ],
  imports: [
    CommonModule,
    OperationsRoutingModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzListModule,
    NzButtonModule,
    NzRadioModule,
    ReactiveFormsModule,
    SharedPipesModule,
    ClipboardModule,
  ]
})
export class OperationsModule { }
