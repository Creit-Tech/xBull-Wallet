import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardDirective } from './clipboard.directive';



@NgModule({
  declarations: [
    ClipboardDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ClipboardDirective,
  ]
})
export class ClipboardModule { }
