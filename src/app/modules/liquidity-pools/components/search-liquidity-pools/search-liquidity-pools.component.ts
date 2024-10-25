import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Asset } from '@stellar/stellar-sdk';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
  HorizonApisQuery,
  ILpAsset,
  ILpAssetLoaded,
  LpAssetsQuery,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/state';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, filter, map, take, takeUntil } from 'rxjs/operators';
import { LiquidityPoolsService } from '~root/core/services/liquidity-pools.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';

@Component({
  selector: 'app-search-liquidity-pools',
  templateUrl: './search-liquidity-pools.component.html',
  styleUrls: ['./search-liquidity-pools.component.scss']
})
export class SearchLiquidityPoolsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  codeTags$: BehaviorSubject<Map<string, Pick<Asset, 'code' | 'issuer'>>> = new BehaviorSubject<Map<string, Pick<Asset, 'code' | 'issuer'>>>(new Map());
  codeTagsArray$: Observable<Array<Pick<Asset, 'code' | 'issuer'>>> = this.codeTags$
    .pipe(map(codeTags => Array.from(codeTags.values())));

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  lpAssets$: Observable<ILpAssetLoaded[]> = this.lpAssetsQuery.selectAll({
    limitTo: 10,
    filterBy: entity => entity.dataLoaded
  }) as Observable<ILpAssetLoaded[]>;

  fetchingLatestPools$ = this.lpAssetsQuery.fetchingLatestPools$;

  assetForm: UntypedFormGroup = new UntypedFormGroup({
    code: new UntypedFormControl('', Validators.required),
    issuer: new UntypedFormControl('', Validators.required)
  });

  constructor(
    private readonly liquidityPoolsService: LiquidityPoolsService,
    private readonly lpAssetsQuery: LpAssetsQuery,
    private readonly cdr: ChangeDetectorRef,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly walletAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  updateLiquidityPoolsSubscription: Subscription = this.codeTagsArray$
    .pipe(debounceTime(1000))
    .pipe(filter(codeTags => codeTags.length > 0))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((codesArray) => {
      this.updateLiquidityPools(codesArray);
    });

  ngOnInit(): void {
    // this.horizonApisQuery.getSelectedHorizonApi$
    //   .pipe(filter<any>(Boolean))
    //   .pipe(switchMap(horizonApi => {
    //     return this.liquidityPoolsService.getLatestPools({
    //       horizonApi
    //     })
    //   }))
    //   .pipe(take(1))
    //   .subscribe(() => {}, error => {
    //     this.nzMessageService.error(`We couldn't get the latest pools, make sure you have Internet connection.`);
    //   });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  trackById(index: number, data: ILpAsset) {
    return data._id;
  }

  addTag(): void {
    if (this.assetForm.invalid) {
      this.nzMessageService.error(`Both asset code and issuer key are required.`);
      return;
    }

    const currentValue = this.codeTags$.getValue();

    if (Array.from(currentValue.values()).length >= 2) {
      this.nzMessageService.error(`Liquidity pools only accept two assets at the moment, remove one and add the new asset.`);
      return;
    }

    if (!currentValue.has(this.assetForm.value.code)) {
      currentValue.set(Object.values(this.assetForm.value).join(':'), {
        code: this.assetForm.value.code,
        issuer: this.assetForm.value.issuer.toUpperCase(),
      });
    }

    this.codeTags$.next(currentValue);
    this.assetForm.reset();
    this.cdr.detectChanges();
  }

  onTagClose(tag: Pick<Asset, 'code' | 'issuer'>): void {
    const currentValue = this.codeTags$.getValue();
    currentValue.delete(Object.values(tag).join(':'));

    this.codeTags$.next(currentValue);
  }

  async updateLiquidityPools(codesArray: Pick<Asset, 'code' | 'issuer'>[]): Promise<void> {
    const horizonApi = await this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1)).toPromise();

    if (!horizonApi) {
      return;
    }

    const fetchAssets = await Promise.all(codesArray.map(({ code, issuer }) => {
      return this.stellarSdkService.selectServer(horizonApi.url)
        .assets()
        .forCode(code)
        .forIssuer(issuer)
        .limit(100)
        .call();
    }));

    this.liquidityPoolsService.getPoolsByAssets({
      horizonApi,
      assets: fetchAssets.reduce((all: Asset[], current) => {
        const assets = current.records.map(record => new this.stellarSdkService.SDK.Asset(record.asset_code, record.asset_issuer));
        return [
          ...all,
          ...assets,
        ];
      }, [])
    })
      .pipe(take(1))
      .subscribe(() => {}, error => {
        this.nzMessageService.error(`We couldn't get liquidity pools, make sure you have Internet connection.`);
      });
  }

}
