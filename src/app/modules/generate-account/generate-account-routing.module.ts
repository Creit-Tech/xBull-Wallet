import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';
import { GenerateWalletComponent } from './pages/generate-wallet/generate-wallet.component';
import { GeneratePasswordComponent } from './pages/generate-password/generate-password.component';
import { ConfirmPhrasePasswordComponent } from './pages/confirm-phrase-password/confirm-phrase-password.component';
import { ConfirmSecretPasswordComponent } from '~root/modules/generate-account/pages/confirm-secret-password/confirm-secret-password.component';
import { ConnectHardwareWalletComponent } from '~root/modules/generate-account/pages/connect-hardware-wallet/connect-hardware-wallet.component';

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
  },
  {
    path: 'confirm-phrase-password',
    component: ConfirmPhrasePasswordComponent,
  },
  {
    path: 'confirm-secret-password',
    component: ConfirmSecretPasswordComponent,
  },
  {
    path: 'connect-hardware-wallet',
    component: ConnectHardwareWalletComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateAccountRoutingModule { }
