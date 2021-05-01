import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextareaComponent } from './textarea/textarea.component';
import { InputComponent } from './input/input.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SelectAndInputComponent } from './select-and-input/select-and-input.component';

@NgModule({
  declarations: [
    TextareaComponent,
    InputComponent,
    SelectAndInputComponent
  ],
  exports: [
    TextareaComponent,
    InputComponent,
    SelectAndInputComponent,
    ReactiveFormsModule,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ]
})
export class FormsComponentsModule { }
