import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GenerateAccountRoutingModule } from './generate-account-routing.module';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';
import { GenerateWalletComponent } from './pages/generate-wallet/generate-wallet.component';
import { FormsComponentsModule } from '../../shared/forms-components/forms-components.module';


@NgModule({
  declarations: [
    CreateAccountSelectionsComponent,
    GenerateWalletComponent
  ],
  imports: [
    CommonModule,
    GenerateAccountRoutingModule,
    FormsComponentsModule,
  ]
})
export class GenerateAccountModule { }
