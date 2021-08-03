import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicKeyPipe } from '~root/shared/shared-pipes/public-key.pipe';
import { Base64ParsePipe } from './base64-parse.pipe';



@NgModule({
  declarations: [
    PublicKeyPipe,
    Base64ParsePipe,
  ],
  exports: [
    PublicKeyPipe,
    Base64ParsePipe
  ],
  imports: [
    CommonModule
  ]
})
export class SharedPipesModule { }
