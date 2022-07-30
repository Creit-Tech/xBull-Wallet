import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicKeyPipe } from '~root/shared/shared-pipes/public-key.pipe';
import { Base64ParsePipe } from './base64-parse.pipe';
import { ShortAmountsPipe } from './short-amounts.pipe';
import { AprToApyPipe } from './apr-to-apy.pipe';



@NgModule({
  declarations: [
    PublicKeyPipe,
    Base64ParsePipe,
    ShortAmountsPipe,
    AprToApyPipe,
  ],
  exports: [
    PublicKeyPipe,
    Base64ParsePipe,
    ShortAmountsPipe,
    AprToApyPipe
  ],
  imports: [
    CommonModule
  ]
})
export class SharedPipesModule { }
