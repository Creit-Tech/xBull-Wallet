import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextareaComponent } from './textarea/textarea.component';
import { InputComponent } from './input/input.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';
import { SelectComponent } from './select/select.component';

@NgModule({
  declarations: [
    TextareaComponent,
    InputComponent,
    SelectComponent
  ],
  exports: [
    ReactiveFormsModule,
    TextareaComponent,
    InputComponent,
    SelectComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskModule.forChild(),
  ],
})
export class FormsComponentsModule { }
