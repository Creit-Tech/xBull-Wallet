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
import { ModalsModule } from '~root/shared/shared-modals/modals.module';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { ConfirmTrezorKeysComponent } from './components/confirm-trezor-keys/confirm-trezor-keys.component';
import {NzSelectModule} from "ng-zorro-antd/select";
import {NzInputModule} from "ng-zorro-antd/input";
import {NzButtonModule} from "ng-zorro-antd/button";
import {ClipboardModule} from "~root/shared/clipboard/clipboard.module";
import {NzCardModule} from "ng-zorro-antd/card";
import {NzAutocompleteModule} from "ng-zorro-antd/auto-complete";
import {NzTagModule} from "ng-zorro-antd/tag";
import { TranslationModule } from '~root/translation.module';
import { ConnectAirGappedWalletComponent } from './pages/connect-air-gapped-wallet/connect-air-gapped-wallet.component';
import { ConnectKeystoneComponent } from './pages/connect-keystone/connect-keystone.component';
import { NzModalComponent, NzModalContentDirective } from 'ng-zorro-antd/modal';
import { NzProgressComponent } from 'ng-zorro-antd/progress';


@NgModule({
  declarations: [
    CreateAccountSelectionsComponent,
    GenerateWalletComponent,
    GeneratePasswordComponent,
    ConfirmPhrasePasswordComponent,
    ConfirmSecretPasswordComponent,
    ConnectHardwareWalletComponent,
    ConfirmPublicKeysComponent,
    ConfirmTrezorKeysComponent,
    ConnectAirGappedWalletComponent,
    ConnectKeystoneComponent
  ],
  imports: [
    CommonModule,
    GenerateAccountRoutingModule,
    FormsComponentsModule,
    ModalsModule,
    SharedPipesModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    ClipboardModule,
    NzCardModule,
    NzAutocompleteModule,
    NzTagModule,
    TranslationModule.forChild(),
    NzModalComponent,
    NzModalContentDirective,
    NzProgressComponent,
  ],
  providers: [
    GenerateAccountStore,
    GenerateAccountQuery,
    GenerateAccountService,
  ]
})
export class GenerateAccountModule { }
