import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { AddAssetComponent } from '~root/modules/wallet/components/add-asset/add-asset.component';
import { SendFundsComponent } from '~root/modules/wallet/components/send-funds/send-funds.component';
import { ReceiveFundsComponent } from '~root/modules/wallet/components/receive-funds/receive-funds.component';
import { AssetDetailsComponent } from '~root/modules/wallet/components/asset-details/asset-details.component';
import { IWalletsAccount, WalletsAccountsQuery, WalletsQuery } from '~root/core/wallets/state';
import { map, pluck, switchMap, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';

@Component({
  selector: 'app-wallet-assets',
  templateUrl: './wallet-assets.component.html',
  styleUrls: ['./wallet-assets.component.scss']
})
export class WalletAssetsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;

  constructor(
    private readonly modalsService: ModalsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  addAsset(): void {
    this.modalsService.open({ component: AddAssetComponent });
  }

  sendFunds(): void {
    this.modalsService.open({ component: SendFundsComponent });
  }

  receiveFunds(): void {
    this.modalsService.open({ component: ReceiveFundsComponent });
  }

  assetDetails(): void {
    this.modalsService.open({ component: AssetDetailsComponent });
  }

}
