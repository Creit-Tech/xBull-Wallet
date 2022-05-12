import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LabRoutingModule } from './lab-routing.module';
import { LabComponent } from './lab.component';
import { ImportXdrComponent } from './pages/import-xdr/import-xdr.component';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { LoadingModule } from '~root/shared/loading/loading.module';
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzInputModule} from "ng-zorro-antd/input";
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { TranslationModule } from '~root/translation.module';


@NgModule({
  declarations: [
    LabComponent,
    ImportXdrComponent,
  ],
  imports: [
    CommonModule,
    LabRoutingModule,
    FormsComponentsModule,
    ClipboardModule,
    SharedPipesModule,
    ModalsModule,
    LoadingModule,
    NzButtonModule,
    NzInputModule,
    NzBreadCrumbModule,
    TranslationModule.forChild(),
  ],
})
export class LabModule { }
