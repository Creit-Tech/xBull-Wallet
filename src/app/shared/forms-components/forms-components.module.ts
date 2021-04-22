import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextareaComponent } from './textarea/textarea.component';
import { InputComponent } from './input/input.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    TextareaComponent,
    InputComponent
  ],
  exports: [
    TextareaComponent,
    InputComponent,
    ReactiveFormsModule,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ]
})
export class FormsComponentsModule { }
