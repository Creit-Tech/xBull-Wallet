import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LabRoutingModule } from './lab-routing.module';
import { LabComponent } from './lab.component';
import { ImportXdrComponent } from './pages/import-xdr/import-xdr.component';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';


@NgModule({
  declarations: [
    LabComponent,
    ImportXdrComponent
  ],
  imports: [
    CommonModule,
    LabRoutingModule,
    FormsComponentsModule,
    ClipboardModule,
  ],
})
export class LabModule { }
