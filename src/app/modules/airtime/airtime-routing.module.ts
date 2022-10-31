import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileTopupComponent } from '~root/modules/airtime/pages/mobile-topup/mobile-topup.component';

const routes: Routes = [
  {
    path: '',
    component: MobileTopupComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AirtimeRoutingModule { }
