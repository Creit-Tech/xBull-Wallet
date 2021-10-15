import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegmentComponent } from './segment.component';
import { RouterModule } from '@angular/router';
import {NzButtonModule} from "ng-zorro-antd/button";



@NgModule({
  declarations: [
    SegmentComponent
  ],
    imports: [
        CommonModule,
        RouterModule,
        NzButtonModule,
    ],
  exports: [
    SegmentComponent
  ]
})
export class SegmentModule { }
