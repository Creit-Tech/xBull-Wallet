import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnchorsDashboardComponent } from '~root/modules/anchors/pages/anchors-dashboard/anchors-dashboard.component';
import { AnchorDetailsComponent } from '~root/modules/anchors/pages/anchor-details/anchor-details.component';

const routes: Routes = [
  {
    path: '',
    component: AnchorsDashboardComponent,
  },
  {
    path: ':anchorId',
    component: AnchorDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnchorsRoutingModule { }
