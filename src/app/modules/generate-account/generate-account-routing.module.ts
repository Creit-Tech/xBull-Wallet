import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';
import { GenerateWalletComponent } from './pages/generate-wallet/generate-wallet.component';
import { GeneratePasswordComponent } from './pages/generate-password/generate-password.component';
import { ConfirmPhrasePasswordComponent } from './pages/confirm-phrase-password/confirm-phrase-password.component';
import { CanCreatePasswordGuard } from '~root/modules/generate-account/guards/can-create-password.guard';

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
    canActivate: [
      CanCreatePasswordGuard,
    ],
    component: GeneratePasswordComponent,
  },
  {
    path: 'confirm-phrase-password',
    component: ConfirmPhrasePasswordComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateAccountRoutingModule { }
