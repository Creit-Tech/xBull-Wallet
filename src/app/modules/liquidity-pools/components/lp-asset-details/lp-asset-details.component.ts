import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { debounceTime, filter, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import {
  HorizonApisQuery,
  ILpAssetLoaded,
  IWalletAsset,
  LpAssetsQuery,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/state';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { Horizon } from 'stellar-sdk';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-lp-asset-details',
  templateUrl: './lp-asset-details.component.html',
  styleUrls: ['./lp-asset-details.component.scss']
})
export class LpAssetDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  removeActionButton$: Subject<void> = new Subject<void>();
  disableActionButton$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  lpAssetId$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set lpAssetId(data: string) {
    this.lpAssetId$.next(data);
  }

  removingAsset$ = this.walletsAssetsQuery.removingAsset$;

  lpAsset$: Observable<ILpAssetLoaded> = this.lpAssetId$
    .pipe(switchMap(lpAssetId => this.lpAssetsQuery.selectEntity(lpAssetId))) as Observable<ILpAssetLoaded>;

  reserves$: Observable<Array<IWalletAsset<any, 'full'>>> = this.lpAsset$
    .pipe(filter<any>(lpAsset => !!lpAsset?.dataLoaded))
    .pipe(switchMap((lpAsset: ILpAssetLoaded) => {
      const [assetACode, assetBCode] = lpAsset.reserves.map(reserve => {
        return reserve.asset.includes(':')
          ? reserve.asset.split(':')[0] + '_' + reserve.asset.split(':')[1]
          : 'native';
      });

      return combineLatest([
        this.walletsAssetsQuery.selectEntity(assetACode),
        this.walletsAssetsQuery.selectEntity(assetBCode),
      ]);
    })) as Observable<Array<IWalletAsset<any, 'full'>>>;

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly lpAssetsQuery: LpAssetsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly translateService: TranslateService,
  ) { }

  onRemoveSubscription: Subscription = this.removeActionButton$
    .asObservable()
    .pipe(debounceTime(100))
    .pipe(tap(() => this.disableActionButton$.next(true)))
    .pipe(switchMap(() => {
      return this.removeAsset()
        .catch(e => {
          console.error(e);
          this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
          return;
        });
    }))
    .pipe(tap(() => this.disableActionButton$.next(false)))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe();

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  parseLpReserveCode(reserve: Horizon.Reserve): string {
    return reserve.asset.includes(':')
      ? reserve.asset.split(':')[0]
      : 'XLM';
  }

  async removeAsset(): Promise<void> {
    const [
      horizonApi,
      selectedAccount,
      lpAsset,
    ] = await Promise.all([
      this.horizonApisQuery.getSelectedHorizonApi$
        .pipe(take(1))
        .toPromise(),
      this.walletsAccountsQuery.getSelectedAccount$
        .pipe(take(1))
        .toPromise(),
      this.lpAsset$
        .pipe(take(1))
        .toPromise()
    ]);

    if (!selectedAccount || !horizonApi || !lpAsset?.dataLoaded) {
      this.nzMessageService.error(`There was an issue selecting the params to continue, please try again`);
      return;
    }

    let loadedAccount;
    try {
      loadedAccount = await this.stellarSdkService.selectServer(horizonApi.url)
        .loadAccount(selectedAccount.publicKey);
    } catch (e: any) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_FETCH_ACCOUNT_FROM_HORIZON'), {
        nzDuration: 5000,
      });
      return;
    }

    const account = new this.stellarSdkService.SDK.Account(loadedAccount.account_id, loadedAccount.sequence);

    const asset = new this.stellarSdkService.SDK.LiquidityPoolAsset(
      lpAsset.reserves[0].asset === 'native'
        ? this.stellarSdkService.SDK.Asset.native()
        : new this.stellarSdkService.SDK.Asset(
          lpAsset.reserves[0].asset.split(':')[0],
          lpAsset.reserves[0].asset.split(':')[1]
        ),
      new this.stellarSdkService.SDK.Asset(
        lpAsset.reserves[1].asset.split(':')[0],
        lpAsset.reserves[1].asset.split(':')[1]
      ),
      this.stellarSdkService.SDK.LiquidityPoolFeeV18,
    );

    const transactionBuilder = new this.stellarSdkService.SDK.TransactionBuilder(account, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    }).setTimeout(this.stellarSdkService.defaultTimeout)
      .addOperation(
        this.stellarSdkService.SDK.Operation.changeTrust({
          limit: '0',
          asset
        })
      );

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: transactionBuilder.build().toXDR(),
        acceptHandler: async signedXdr1 => {
          if (!signedXdr1) {
            this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
            return;
          }

          try {
            await this.walletsAssetsService.removeAssetFromAccount(signedXdr1);
            this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));
            this.nzDrawerRef.close();
          } catch (e: any) {
            console.error(e);
            this.nzMessageService.success(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'), {
              nzDuration: 5000,
            });
            return;
          }

          this.walletsAccountsService.getAccountData({
            account: selectedAccount,
            horizonApi
          }).toPromise()
            .then()
            .catch(e => console.error(e));
        }
      },
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: this.translateService.instant('COMMON_WORDS.REMOVE'),
    });
  }

}
