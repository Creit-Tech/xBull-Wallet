import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';
import { GenerateWalletComponent } from './pages/generate-wallet/generate-wallet.component';
import { GeneratePasswordComponent } from './pages/generate-password/generate-password.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: CreateAccountSelectionsComponent,
  },
  {
    path: 'generate-wallet',
    component: GenerateWalletComponent,
  },
  {
    path: 'generate-password',
    component: GeneratePasswordComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateAccountRoutingModule { }
