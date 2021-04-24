import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WalletAssetsComponent } from '~root/modules/wallet/pages/wallet-assets/wallet-assets.component';

const routes: Routes = [
  {
    path: 'assets',
    component: WalletAssetsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
