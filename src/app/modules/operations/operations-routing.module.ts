import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  OperationsDashboardComponent
} from '~root/modules/operations/pages/operations-dashboard/operations-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: OperationsDashboardComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperationsRoutingModule { }
