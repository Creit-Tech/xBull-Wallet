import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';
import { GenerateWalletComponent } from './pages/generate-wallet/generate-wallet.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: CreateAccountSelectionsComponent,
  },
  {
    path: 'generate-wallet',
    component: GenerateWalletComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateAccountRoutingModule { }
