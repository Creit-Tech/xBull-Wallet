import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnectDashboardComponent } from '~root/modules/connect/pages/connect-dashboard/connect-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: ConnectDashboardComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConnectRoutingModule { }
