import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LabComponent } from '~root/modules/lab/lab.component';
import { ImportXdrComponent } from '~root/modules/lab/pages/import-xdr/import-xdr.component';
import { ClaimClaimableBalanceComponent } from '~root/modules/lab/pages/claim-claimable-balance/claim-claimable-balance.component';

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
    path: 'claim-claimable-balance',
    component: ClaimClaimableBalanceComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LabRoutingModule { }
