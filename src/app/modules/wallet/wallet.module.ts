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


@NgModule({
  declarations: [
    WalletAssetsComponent,
    AssetItemComponent,
    AddAssetComponent
  ],
  imports: [
    CommonModule,
    WalletRoutingModule,
    SegmentModule,
    ReactiveFormsModule,
    FormsComponentsModule,
  ],
})
export class WalletModule { }
