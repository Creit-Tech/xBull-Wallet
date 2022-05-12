import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardDirective } from './clipboard.directive';
import { TranslationModule } from '~root/translation.module';



@NgModule({
  declarations: [
    ClipboardDirective
  ],
  imports: [
    CommonModule,
    TranslationModule.forChild(),
  ],
  exports: [
    ClipboardDirective,
  ]
})
export class ClipboardModule { }
