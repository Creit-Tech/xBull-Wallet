import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingDirective } from './loading.directive';
import { PulseLoadingComponent } from './pulse-loading/pulse-loading.component';



@NgModule({
  declarations: [
    LoadingDirective,
    PulseLoadingComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    LoadingDirective,
  ]
})
export class LoadingModule { }
