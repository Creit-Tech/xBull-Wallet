import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HorizonApisQuery, IWalletAssetIssued, IWalletAssetNative, WalletsAssetsQuery } from '~root/state';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { applyTransaction, Order } from '@datorama/akita';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-asset-searcher',
  templateUrl: './asset-searcher.component.html',
  styleUrls: ['./asset-searcher.component.scss']
})
export class AssetSearcherComponent implements OnInit {
  defaultAssets$: BehaviorSubject<(IWalletAssetNative | IWalletAssetIssued)[]> = new BehaviorSubject<(IWalletAssetNative | IWalletAssetIssued)[]>([]);
  @Input() set defaultAssets(data: (IWalletAssetNative | IWalletAssetIssued)[]) {
    this.defaultAssets$.next(data || []);
  }

  @Input()
  disableCustomAsset?: boolean;

  @Output()
  assetSelected: EventEmitter<IWalletAssetNative | IWalletAssetIssued> = new EventEmitter<IWalletAssetNative | IWalletAssetIssued>();

  @Input()
  assetSelectedFunc?: (asset: IWalletAssetNative | IWalletAssetIssued) => any;

  searchInputControl = new FormControl('', [Validators.required]);
  searchCuratedInputControl = new FormControl('', [Validators.required]);

  customAssetForm: FormGroup = new FormGroup({
    assetCode: new FormControl('', [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(12)
    ]),
    assetIssuer: new FormControl('', [
      Validators.required,
      Validators.minLength(56),
      Validators.maxLength(56)
    ]),
    limit: new FormControl(''),
  });

  filteredDefaultAssets$ = this.searchInputControl
    .valueChanges
    .pipe(debounceTime(80))
    .pipe(startWith(''))
    .pipe(withLatestFrom(this.defaultAssets$))
    .pipe(map(([searchValue, defaultAssets]) => {
      if (!searchValue) {
        return defaultAssets;
      }

      return defaultAssets.filter(asset => {
        if (!!(asset as IWalletAssetIssued).assetIssuer) {
          return asset.assetCode === searchValue || asset.assetCode.toLowerCase().includes(searchValue.toLowerCase());
        } else {
          return asset.assetCode.toLowerCase().includes(searchValue.toLowerCase());
        }
      });
    }));

  // searchedAssets$ = this.searchInputControl
  //   .valueChanges
  //   .pipe(debounceTime(1000))
  //   .pipe(withLatestFrom(this.defaultAssets$))
  //   .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
  //   .pipe(switchMap(([[searchValue, defaultAssets], horizonApi]) => {
  //     if (!searchValue) {
  //       return of([]);
  //     }
  //
  //     return this.walletsAssetsQuery.selectAll({
  //       //@ts-ignore
  //       filterBy: (entity: IWalletAssetIssued) => (entity.assetIssuer === searchValue
  //         || entity.assetCode === searchValue)
  //         && entity.networkPassphrase === horizonApi.networkPassphrase
  //         && !defaultAssets.find(da => da._id === entity._id),
  //     }) as Observable<IWalletAssetIssued[]>;
  //   }));

  constructor(
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly nzDrawerRef: NzDrawerRef,
  ) { }

  // getAssetsFromHorizonSubscription: Subscription = this.searchInputControl
  //   .valueChanges
  //   .pipe(distinctUntilChanged())
  //   .pipe(debounceTime(1000))
  //   .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
  //   .pipe(switchMap(([searchValue, horizonApi]) => {
  //     if (!searchValue) {
  //       return [];
  //     }
  //
  //     let validPublicKey = false;
  //     try {
  //       this.stellarSdkService.SDK.Keypair.fromPublicKey(searchValue);
  //       validPublicKey = true;
  //     } catch (e) {}
  //
  //     const server = new this.stellarSdkService.SDK.Server(horizonApi.url);
  //     const horizonCall = validPublicKey
  //       ? server.assets().forIssuer(searchValue)
  //       : server.assets().forCode(searchValue);
  //
  //     return horizonCall
  //       .limit(25)
  //       .call()
  //       .then(response => response.records)
  //       .catch(error => {
  //         console.error(error);
  //         return [];
  //       });
  //   }))
  //   .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
  //   .subscribe(([records, horizonApi]) => {
  //     applyTransaction(() => {
  //       for (const record of records) {
  //         const initialState = {
  //           _id: this.walletsAssetsService.formatBalanceLineId(record),
  //           assetCode: record.asset_code,
  //           assetIssuer: record.asset_issuer,
  //           networkPassphrase: horizonApi.networkPassphrase
  //         };
  //
  //         this.walletsAssetsService.saveInitialAssetState(initialState);
  //         const savedData = this.walletsAssetsQuery.getEntity(this.walletsAssetsService.formatBalanceLineId(record));
  //         const asset = savedData || initialState;
  //
  //         this.walletsAssetsService.requestAssetInformation$.next({
  //           asset,
  //           horizonApi,
  //           forceUpdate: false
  //         });
  //       }
  //     });
  //   });

  ngOnInit(): void {
    this.defaultAssets$
      .pipe(take(1))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .subscribe(([defaultAssets, horizonApi]) => {
        defaultAssets.forEach(asset => {
          this.walletsAssetsService.requestAssetInformation$.next({
            asset,
            horizonApi,
            forceUpdate: false
          });
        });
      });
  }

  onAssetSelected(asset: IWalletAssetNative | IWalletAssetIssued): void {
    this.assetSelected.emit(asset);

    if (!!this.assetSelectedFunc) {
      this.assetSelectedFunc(asset);
    }

    this.nzDrawerRef.close();
  }

  async onCustomAssetConfirmed(): Promise<void> {
    const horizonApi = await this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1)).toPromise();
    if (this.customAssetForm.invalid || !horizonApi) {
      return;
    }

    const valueToEmit = {
      _id: this.walletsAssetsService.formatBalanceLineId({
        asset_code: this.customAssetForm.value.assetCode,
        asset_issuer: this.customAssetForm.value.assetIssuer,
        // We know this could be alphanum12 but is only to fool the type
        asset_type: 'credit_alphanum4',
      }),
      assetCode: this.customAssetForm.value.assetCode,
      assetIssuer: this.customAssetForm.value.assetIssuer,
      // We don't need this passphrase, but we send it anyway in case in the future we want to add something that it requires it
      networkPassphrase: horizonApi.networkPassphrase
    };

    this.assetSelected.emit(valueToEmit);

    if (!!this.assetSelectedFunc) {
      this.assetSelectedFunc(valueToEmit);
    }

    this.nzDrawerRef.close();
  }

}
