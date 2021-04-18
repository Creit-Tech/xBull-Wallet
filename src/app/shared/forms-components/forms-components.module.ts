import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextareaComponent } from './textarea/textarea.component';
import { InputComponent } from './input/input.component';

@NgModule({
  declarations: [
    TextareaComponent,
    InputComponent
  ],
  exports: [
    TextareaComponent,
    InputComponent
  ],
  imports: [
    CommonModule
  ]
})
export class FormsComponentsModule { }
