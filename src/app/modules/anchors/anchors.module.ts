import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnchorsRoutingModule } from './anchors-routing.module';
import { AnchorsDashboardComponent } from './pages/anchors-dashboard/anchors-dashboard.component';
import { AnchorsQuery } from '~root/modules/anchors/state/anchors.query';
import { AnchorsStore } from '~root/modules/anchors/state/anchors.store';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AnchorDetailsComponent } from './pages/anchor-details/anchor-details.component';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { NzListModule } from 'ng-zorro-antd/list';
import { AnchorsService } from '~root/modules/anchors/services/anchors.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  AnchorsInvalidAuthTokenInterceptor
} from '~root/modules/anchors/interceptors/anchors-invalid-auth-token.interceptor';
import { AnchoredAssetInteractionDrawerComponent } from './components/anchored-asset-interaction-drawer/anchored-asset-interaction-drawer.component';
import { AnchorsAuthTokensQuery } from '~root/modules/anchors/state/anchors-auth-tokens.query';
import { AnchorsAuthTokensStore } from '~root/modules/anchors/state/anchors-auth-tokens.store';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ReactiveFormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AddAnchorModalComponent } from './components/add-anchor-modal/add-anchor-modal.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TranslationModule } from '~root/translation.module';


@NgModule({
  declarations: [
    AnchorsDashboardComponent,
    AnchorDetailsComponent,
    AnchoredAssetInteractionDrawerComponent,
    AddAnchorModalComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    AnchorsRoutingModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzAvatarModule,
    NzButtonModule,
    NzTableModule,
    NzDividerModule,
    SharedPipesModule,
    ClipboardModule,
    NzListModule,
    NzInputNumberModule,
    ReactiveFormsModule,
    NzModalModule,
    NzStepsModule,
    NzInputModule,
    NzFormModule,
    TranslationModule.forChild(),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AnchorsInvalidAuthTokenInterceptor,
      multi: true
    },
    AnchorsQuery,
    AnchorsStore,
    AnchorsService,
    AnchorsAuthTokensQuery,
    AnchorsAuthTokensStore,
  ]
})
export class AnchorsModule { }
