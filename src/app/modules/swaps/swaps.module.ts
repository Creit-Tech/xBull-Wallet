import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SwapsRoutingModule } from './swaps-routing.module';
import { SwapsComponent } from './pages/swaps/swaps.component';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { AssetSearcherModule } from '~root/shared/asset-searcher/asset-searcher.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { TranslationModule } from '~root/translation.module';
import { SharedComponentsModule } from '~root/shared/shared-components/shared-components.module';
import { NgxMaskDirective, NgxMaskPipe, provideEnvironmentNgxMask } from 'ngx-mask';


@NgModule({
  declarations: [
    SwapsComponent
  ],
  imports: [
    CommonModule,
    SwapsRoutingModule,
    NzCardModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzFormModule,
    NgxMaskDirective,
    NgxMaskPipe,
    AssetSearcherModule,
    ReactiveFormsModule,
    SharedPipesModule,
    NzRadioModule,
    NzToolTipModule,
    NzListModule,
    NzSpinModule,
    NzBreadCrumbModule,
    TranslationModule.forChild(),
    SharedComponentsModule,
  ],
  providers: [
    provideEnvironmentNgxMask()
  ]
})
export class SwapsModule { }
