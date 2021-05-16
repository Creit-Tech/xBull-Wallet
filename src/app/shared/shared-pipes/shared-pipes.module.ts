import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicKeyPipe } from '~root/shared/shared-pipes/public-key.pipe';



@NgModule({
  declarations: [
    PublicKeyPipe,
  ],
  exports: [
    PublicKeyPipe,
  ],
  imports: [
    CommonModule
  ]
})
export class SharedPipesModule { }
