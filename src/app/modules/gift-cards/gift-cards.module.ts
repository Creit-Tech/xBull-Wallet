import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GiftCardsRoutingModule } from './gift-cards-routing.module';
import { GiftCardsSearchComponent } from './pages/gift-cards-search/gift-cards-search.component';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ReactiveFormsModule } from '@angular/forms';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { GiftCardDetailsComponent } from './components/gift-card-details/gift-card-details.component';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { SharedComponentsModule } from '~root/shared/shared-components/shared-components.module';
import { GiftCardsOrdersComponent } from './components/gift-cards-orders/gift-cards-orders.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { GiftCardOrderDetailsComponent } from './components/gift-card-order-details/gift-card-order-details.component';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationModule } from '~root/translation.module';


@NgModule({
  declarations: [
    GiftCardsSearchComponent,
    GiftCardDetailsComponent,
    GiftCardsOrdersComponent,
    GiftCardOrderDetailsComponent,
  ],
  imports: [
    CommonModule,
    GiftCardsRoutingModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    ReactiveFormsModule,
    NzSpinModule,
    NzListModule,
    NzEmptyModule,
    NzInputNumberModule,
    SharedPipesModule,
    NzModalModule,
    SharedComponentsModule,
    NzDividerModule,
    ClipboardModule,
    TranslationModule.forChild(),
  ]
})
export class GiftCardsModule { }
