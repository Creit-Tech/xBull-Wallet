import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PressButtonDirective } from './press-button.directive';



@NgModule({
  declarations: [
    PressButtonDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PressButtonDirective
  ]
})
export class PressButtonModule { }
