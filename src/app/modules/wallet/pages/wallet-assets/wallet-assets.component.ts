import { Component, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { AssetItemComponent } from '~root/modules/wallet/components/asset-item/asset-item.component';
import { AddAssetComponent } from '~root/modules/wallet/components/add-asset/add-asset.component';
import { SendFundsComponent } from '~root/modules/wallet/components/send-funds/send-funds.component';

@Component({
  selector: 'app-wallet-assets',
  templateUrl: './wallet-assets.component.html',
  styleUrls: ['./wallet-assets.component.scss']
})
export class WalletAssetsComponent implements OnInit {

  constructor(
    private readonly modalsService: ModalsService,
  ) { }

  ngOnInit(): void {
  }

  addAsset(): void {
    this.modalsService.open({ component: AddAssetComponent });
  }

  sendFunds(): void {
    this.modalsService.open({ component: SendFundsComponent });
  }

}
