import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextareaComponent } from './textarea/textarea.component';

@NgModule({
  declarations: [
    TextareaComponent
  ],
  exports: [
    TextareaComponent
  ],
  imports: [
    CommonModule
  ]
})
export class FormsComponentsModule { }
