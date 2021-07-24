import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { merge, Subject, Subscription } from 'rxjs';
import { ModalsService } from '~root/shared/modals/modals.service';
import { AddAssetComponent } from '~root/modules/wallet/components/add-asset/add-asset.component';
import { SendFundsComponent } from '~root/modules/wallet/components/send-funds/send-funds.component';
import { ReceiveFundsComponent } from '~root/modules/wallet/components/receive-funds/receive-funds.component';
import { AssetDetailsComponent } from '~root/modules/wallet/components/asset-details/asset-details.component';
import { HorizonApisQuery, IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/state';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';
import { exhaustMap, filter, map, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';

@Component({
  selector: 'app-wallet-assets',
  templateUrl: './wallet-assets.component.html',
  styleUrls: ['./wallet-assets.component.scss']
})
export class WalletAssetsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;
  reloadSelectedAccount$: Subject<void> = new Subject<void>();

  accountBalances$ = this.selectedAccount$
    .pipe(filter(account => !!account))
    .pipe(map(account => account?.accountRecord?.balances || []))

    // A hack because for some reason the view doesn't want to update with the observable (I'm probably missing something obvious)
    // TODO: We need to update this
    // .pipe(tap(() => setTimeout(() => this.cdr.detectChanges(), 10)));

  constructor(
    private readonly modalsService: ModalsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly horizonApiQuery: HorizonApisQuery,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  reloadSelectedAccountSubscription: Subscription = this.reloadSelectedAccount$
    .asObservable()
    .pipe(switchMap(() => this.selectedAccount$.pipe(take(1))))
    .pipe(withLatestFrom(this.horizonApiQuery.getSelectedHorizonApi$))
    .pipe(exhaustMap(([selectedAccount, selectedHorizonApi]) => this.walletsAccountsService.getAccountData({
      horizonApi: selectedHorizonApi,
      account: selectedAccount,
    })))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe();

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async addAsset(): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<AddAssetComponent>(AddAssetComponent);

    merge(
      ref.component.instance.assetAdded.asObservable(),
      ref.component.instance.closed.asObservable()
    )
      .pipe(take(1))
      .pipe(takeUntil(merge(this.componentDestroyed$.asObservable(), ref.destroyed$.asObservable())))
      .subscribe(() => {
        this.reloadSelectedAccount$.next();
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

  async sendFunds(): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<SendFundsComponent>(SendFundsComponent);

    merge(
      ref.component.instance.paymentSent.asObservable(),
      ref.component.instance.closed.asObservable()
    )
      .pipe(take(1))
      .pipe(takeUntil(merge(this.componentDestroyed$.asObservable(), ref.destroyed$.asObservable())))
      .subscribe(() => {
        this.reloadSelectedAccount$.next();
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

  receiveFunds(): void {
    this.modalsService.open({ component: ReceiveFundsComponent });
  }

  async assetDetails(balanceLine: Horizon.BalanceLine): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<AssetDetailsComponent>(AssetDetailsComponent);

    ref.component.instance.assetId = this.walletsAssetsService.formatBalanceLineId(balanceLine);

    merge(
      ref.component.instance.assetRemoved.asObservable(),
      ref.component.instance.close.asObservable(),
    )
      .pipe(take(1))
      .pipe(takeUntil(merge(this.componentDestroyed$.asObservable(), ref.destroyed$.asObservable())))
      .subscribe(() => {
        this.reloadSelectedAccount$.next();
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

}
