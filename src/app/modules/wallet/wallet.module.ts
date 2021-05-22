import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletRoutingModule } from './wallet-routing.module';
import { WalletAssetsComponent } from './pages/wallet-assets/wallet-assets.component';
import { SegmentModule } from '~root/shared/segment/segment.module';
import { AssetItemComponent } from './components/asset-item/asset-item.component';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { AddAssetComponent } from './components/add-asset/add-asset.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { SendFundsComponent } from './components/send-funds/send-funds.component';
import { ReceiveFundsComponent } from './components/receive-funds/receive-funds.component';
import { AssetDetailsComponent } from './components/asset-details/asset-details.component';
import { WalletOffersComponent } from './pages/wallet-offers/wallet-offers.component';
import { WalletComponent } from './wallet.component';
import { OfferDetailsComponent } from './components/offer-details/offer-details.component';
import { WalletTransactionsComponent } from './pages/wallet-transactions/wallet-transactions.component';
import { TransactionDetailsComponent } from './components/transaction-details/transaction-details.component';
import { LoadingModule } from '~root/shared/loading/loading.module';
import { ClipboardModule } from '~root/shared/clipboard/clipboard.module';
import { NgxMaskModule } from 'ngx-mask';
import { WalletTransactionItemComponent } from './components/wallet-transaction-item/wallet-transaction-item.component';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';


@NgModule({
  declarations: [
    WalletAssetsComponent,
    AssetItemComponent,
    AddAssetComponent,
    SendFundsComponent,
    ReceiveFundsComponent,
    AssetDetailsComponent,
    WalletOffersComponent,
    WalletComponent,
    OfferDetailsComponent,
    WalletTransactionsComponent,
    TransactionDetailsComponent,
    WalletTransactionItemComponent
  ],
  imports: [
    CommonModule,
    WalletRoutingModule,
    SegmentModule,
    FormsComponentsModule,
    LoadingModule,
    ClipboardModule,
    SharedPipesModule,
  ],
})
export class WalletModule { }
