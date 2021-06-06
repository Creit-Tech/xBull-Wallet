import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { DefaultFeeFormComponent } from './components/default-fee-form/default-fee-form.component';
import { LoadingModule } from '~root/shared/loading/loading.module';


@NgModule({
  declarations: [
    SettingsComponent,
    DefaultFeeFormComponent
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    FormsComponentsModule,
    LoadingModule,
  ],
})
export class SettingsModule { }
