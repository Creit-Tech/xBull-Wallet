import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PathPaymentFormComponent } from './path-payment-form/path-payment-form.component';
import { TranslationModule } from '~root/translation.module';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NgxMaskModule } from 'ngx-mask';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ScamAlertIconComponent } from '~root/shared/shared-components/scam-alert-icon/scam-alert-icon.component';

const COMPONENTS = [
  PathPaymentFormComponent,
  ScamAlertIconComponent,
];

@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS,
  imports: [
    CommonModule,
    TranslationModule.forChild(),
    NzListModule,
    NzSpinModule,
    NzCardModule,
    NgxMaskModule,
    NzInputModule,
    ReactiveFormsModule,
    NzFormModule,
    NzButtonModule,
    SharedPipesModule,
    NzRadioModule,
    NzToolTipModule,
  ]
})
export class SharedComponentsModule { }
