import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SwapsComponent } from '~root/modules/swaps/pages/swaps/swaps.component';

const routes: Routes = [
  {
    path: '',
    component: SwapsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SwapsRoutingModule { }
