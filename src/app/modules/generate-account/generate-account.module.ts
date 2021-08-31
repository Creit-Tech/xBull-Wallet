import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GenerateAccountRoutingModule } from './generate-account-routing.module';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';
import { GenerateWalletComponent } from './pages/generate-wallet/generate-wallet.component';
import { FormsComponentsModule } from '../../shared/forms-components/forms-components.module';
import { GeneratePasswordComponent } from './pages/generate-password/generate-password.component';
import { ConfirmPhrasePasswordComponent } from './pages/confirm-phrase-password/confirm-phrase-password.component';
import { GenerateAccountQuery, GenerateAccountService, GenerateAccountStore } from './state';
import { ConfirmSecretPasswordComponent } from './pages/confirm-secret-password/confirm-secret-password.component';
import { ConnectHardwareWalletComponent } from './pages/connect-hardware-wallet/connect-hardware-wallet.component';
import { ConfirmPublicKeysComponent } from './components/confirm-public-keys/confirm-public-keys.component';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';


@NgModule({
  declarations: [
    CreateAccountSelectionsComponent,
    GenerateWalletComponent,
    GeneratePasswordComponent,
    ConfirmPhrasePasswordComponent,
    ConfirmSecretPasswordComponent,
    ConnectHardwareWalletComponent,
    ConfirmPublicKeysComponent
  ],
  imports: [
    CommonModule,
    GenerateAccountRoutingModule,
    FormsComponentsModule,
    ModalsModule,
    SharedPipesModule,
  ],
  providers: [
    GenerateAccountStore,
    GenerateAccountQuery,
    GenerateAccountService,
  ]
})
export class GenerateAccountModule { }
