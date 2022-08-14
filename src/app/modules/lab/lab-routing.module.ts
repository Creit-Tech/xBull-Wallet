import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LabComponent } from '~root/modules/lab/lab.component';
import { ImportXdrComponent } from '~root/modules/lab/pages/import-xdr/import-xdr.component';
import { MergeAccountsComponent } from '~root/modules/lab/pages/merge-accounts/merge-accounts.component';

const routes: Routes = [
  {
    path: '',
    component: LabComponent,
  },
  {
    path: 'import-xdr',
    component: ImportXdrComponent,
  },
  {
    path: 'merge-account',
    component: MergeAccountsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LabRoutingModule { }
