import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetSearcherComponent } from './asset-searcher.component';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';



@NgModule({
  declarations: [
    AssetSearcherComponent
  ],
  imports: [
    CommonModule,
    NzInputModule,
    NzListModule,
    NzButtonModule,
    NzSkeletonModule,
    ReactiveFormsModule,
    SharedPipesModule,
    NzTabsModule,
    NzFormModule
  ],
  exports: [
    AssetSearcherComponent
  ]
})
export class AssetSearcherModule { }
