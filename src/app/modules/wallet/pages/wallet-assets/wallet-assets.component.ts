import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalsService } from '~root/shared/modals/modals.service';
import { AddAssetComponent } from '~root/modules/wallet/components/add-asset/add-asset.component';
import { SendFundsComponent } from '~root/modules/wallet/components/send-funds/send-funds.component';
import { ReceiveFundsComponent } from '~root/modules/wallet/components/receive-funds/receive-funds.component';
import { AssetDetailsComponent } from '~root/modules/wallet/components/asset-details/asset-details.component';
import { IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/core/wallets/state';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';
import { switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';

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
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async addAsset(): Promise<void> {
    const modalData = await this.modalsService.open<AddAssetComponent>({ component: AddAssetComponent });

    modalData.componentRef.instance.assetAdded
      .asObservable()
      .pipe(tap(() => modalData.modalContainer.instance.onClose()))
      .pipe(withLatestFrom(this.selectedAccount$))
      .pipe(switchMap(([_, selectedAccount]) => this.walletsAccountsService.getAccountData(selectedAccount._id)))
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe();
  }

  sendFunds(): void {
    this.modalsService.open({ component: SendFundsComponent });
  }

  receiveFunds(): void {
    this.modalsService.open({ component: ReceiveFundsComponent });
  }

  assetDetails(balanceLine: Horizon.BalanceLine): void {
    this.modalsService.open({
      component: AssetDetailsComponent,
      componentInputs: [{
        input: 'assetId',
        value: this.walletsAssetsService.formatBalanceLineId(balanceLine)
      }]
    });
  }

}
