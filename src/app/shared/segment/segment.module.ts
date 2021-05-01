import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegmentComponent } from './segment.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    SegmentComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    SegmentComponent
  ]
})
export class SegmentModule { }
