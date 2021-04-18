import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GenerateAccountRoutingModule } from './generate-account-routing.module';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';


@NgModule({
  declarations: [
    CreateAccountSelectionsComponent
  ],
  imports: [
    CommonModule,
    GenerateAccountRoutingModule
  ]
})
export class GenerateAccountModule { }
