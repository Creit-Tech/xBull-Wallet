import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletRoutingModule } from './wallet-routing.module';
import { WalletAssetsComponent } from './pages/wallet-assets/wallet-assets.component';
import { SegmentModule } from '~root/shared/segment/segment.module';
import { AssetItemComponent } from './components/asset-item/asset-item.component';


@NgModule({
  declarations: [
    WalletAssetsComponent,
    AssetItemComponent
  ],
  imports: [
    CommonModule,
    WalletRoutingModule,
    SegmentModule,
  ]
})
export class WalletModule { }
