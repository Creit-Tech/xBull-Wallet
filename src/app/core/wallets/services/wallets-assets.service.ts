import { Injectable } from '@angular/core';
import { Horizon, Server, ServerApi, Asset, StellarTomlResolver } from 'stellar-sdk';
import {
  BalanceAssetType,
  IHorizonApi,
  IWalletAsset,
  IWalletNativeAsset,
  LpAssetsStore,
  WalletsAssetsState,
  WalletsAssetsStore,
  IWalletIssuedAsset,
  SettingsQuery,
  IWalletAssetModel,
  parseCurrencyDetails,
} from '~root/state';
import { from, merge, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { OfferAsset } from 'stellar-sdk/lib/types/offer';
import { add, isAfter } from 'date-fns';
import { createCuratedAsset, ICuratedAsset } from '~root/state/curated-assets/curated-asset.model';
import { CuratedAssetsStore } from '~root/state/curated-assets/curated-assets.store';
import { applyTransaction } from '@datorama/akita';

@Injectable({
  providedIn: 'root'
})
export class WalletsAssetsService {
  // TODO: Make this optional before launching the app IE add a settings store
  // DEPRECATED
  requestAssetData$: Subject<{
    _id: IWalletAsset['_id'],
    assetIssuer: IWalletAsset<'issued'>['assetIssuer'],
    assetCode: IWalletAsset<'issued'>['assetCode'],
    horizonApi: IHorizonApi,
  }> = new Subject();


  // This is the new version, stop using the one above
  requestAssetInformation$: Subject<{
    asset: IWalletAssetModel,
    horizonApi: IHorizonApi,
    forceUpdate: boolean,
  }> = new Subject();
  shouldRequestAssetInformation$ = this.requestAssetInformation$.asObservable()
    .pipe(switchMap(params => {
      return of(true)
        .pipe(map(_ => {
          if (params.asset._id === 'native') {
            return false;
          }
          if (params.forceUpdate) {
            return true;
          }

          if (!params.asset.lastTimeUpdated) {
            return true;
          }

          const lastUpdate = new Date(params.asset.lastTimeUpdated);
          // TODO: maybe we should make this time dynamic and configurable form the settings
          const nextUpdate = add(lastUpdate, { minutes: 15 });
          const now = new Date();
          return !params.asset.assetFullDataLoaded && isAfter(now, nextUpdate);
        }))
        .pipe(filter(Boolean))
        .pipe(map(_ => ({
          asset: params.asset as IWalletAssetModel,
          horizonApi: params.horizonApi,
        })));
    }))
    .pipe(map(({ asset, horizonApi}) => {
      return {
        _id: asset._id,
        assetIssuer: asset.assetIssuer,
        assetCode: asset.assetCode,
        horizonApi,
      };
    }));

  constructor(
    private readonly walletsAssetsStore: WalletsAssetsStore,
    private readonly http: HttpClient,
    private readonly stellarSdkService: StellarSdkService,
    private readonly lpAssetsStore: LpAssetsStore,
    private readonly settingsQuery: SettingsQuery,
    private readonly curatedAssetsStore: CuratedAssetsStore,
  ) { }

  // DEPRECATED
  requestAssetDataSubscription: Subscription = merge(this.requestAssetData$, this.shouldRequestAssetInformation$)
    .pipe(mergeMap(params => {
      this.walletsAssetsStore.upsert(params._id, { lastTimeUpdated: new Date() });
      return this.getAssetExtraRecord(params)
        .pipe(switchMap(_ => {
          return this.getAssetFullRecord(params)
            .pipe(catchError(error => {
              console.error(error);
              return of(error);
            }));
        }))
        .pipe(catchError(error => {
          console.error(error);
          return of(error);
        }));
    }, 1))
    .subscribe();


  private simpleStateUpdateFlow(xdr: string, stateField: keyof WalletsAssetsState['UIState']): Promise<Horizon.SubmitTransactionResponse> {
    this.walletsAssetsStore.updateUIState({ [stateField]: true });
    return this.stellarSdkService.submitTransaction(xdr)
      .then((response) => {
        this.walletsAssetsStore.updateUIState({ [stateField]: false });
        return response;
      })
      .catch(error => {
        this.walletsAssetsStore.updateUIState({ [stateField]: false });
        return Promise.reject(error);
      });
  }

  getAssetExtraRecord(data: {
    _id: IWalletAsset['_id'],
    assetIssuer: IWalletAsset<'issued'>['assetIssuer'],
    assetCode: IWalletAsset<'issued'>['assetCode'],
    horizonApi: IHorizonApi,
  }): Observable<ServerApi.AssetRecord> {
    const recordPromise = new Server(data.horizonApi.url).assets()
      .forCode(data.assetCode)
      .forIssuer(data.assetIssuer)
      .call();

    return from(recordPromise)
      .pipe(map(response => response.records.shift()))
      .pipe(map(assetRecord => {
        if (!assetRecord) {
          throw new Error(`We couldn't get the record for the asset ${data._id}`);
        }

        const newData = {
          amountIssued: assetRecord.amount,
          numAccount: assetRecord.num_accounts,
          assetExtraDataLoaded: true,
          networkPassphrase: data.horizonApi.networkPassphrase,
        };

        this.walletsAssetsStore.upsert(data._id, newData);

        return assetRecord;
      }));
  }

  getAssetFullRecord(data: {
    _id: IWalletAsset['_id'],
    assetIssuer: IWalletAsset<'issued'>['assetIssuer'],
    assetCode: IWalletAsset<'issued'>['assetCode'],
    horizonApi: IHorizonApi,
  }): Observable<ServerApi.AccountRecord> {
    const recordPromise = new Server(data.horizonApi.url).accounts()
      .accountId(data.assetIssuer)
      .call();

    return from(recordPromise)
      .pipe(filter(accountRecord => !!accountRecord))
      .pipe(switchMap(accountRecord => {
        return from(StellarTomlResolver.resolve((accountRecord as any).home_domain))
          .pipe(withLatestFrom(of(accountRecord)));
      }))
      .pipe(switchMap(async ([parsedToml, accountRecord]) => {
        const documentation = parsedToml.DOCUMENTATION || parsedToml.documentation;
        const currencies = parsedToml.CURRENCIES || parsedToml.currencies;
        const assetMetadataServer = parsedToml.ASSET_METADATA_SERVER || parsedToml.asset_metadata_server;
        let currency = (currencies || []).find((c: any) => {
          if (!!c.code_template) {
            const index = c.code_template.indexOf('?');
            if (index === -1) {
              return false;
            }
            const baseTemplate = c.code_template.slice(0, index);
            const dynamicTemplate = c.code_template.slice(index);

            const baseTemplateFromAssetCode = data.assetCode.slice(0, index);
            const dynamicTemplateFromAssetCode = c.code_template.slice(index);

            return baseTemplate === baseTemplateFromAssetCode
              && dynamicTemplate.length === dynamicTemplateFromAssetCode.length
              && c.issuer === data.assetIssuer;
          }

          return c.code === data.assetCode && c.issuer === data.assetIssuer;
        });

        if (!currency && !!assetMetadataServer) {
          try {
            currency = await this.getAssetFromMetadataServer({
              url: assetMetadataServer,
              code: data.assetCode,
              issuer: data.assetIssuer
            });
          } catch (e) {}
        }

        this.walletsAssetsStore.upsert(
          data._id,
          {
            domain: accountRecord.home_domain,
            ...parseCurrencyDetails(currency),
            orgName: documentation?.ORG_NAME,
            orgDba: documentation?.ORG_DBA,
            orgDescription: documentation?.ORG_DESCRIPTION,
            orgWebsite: documentation?.ORG_URL,
            orgAddress: documentation?.ORG_PHYSICAL_ADDRESS,
            orgOfficialEmail: documentation?.ORG_OFFICIAL_EMAIL,
            assetFullDataLoaded: true,
            networkPassphrase: data.horizonApi.networkPassphrase,
          }
        );
        return accountRecord;
      }));
  }

  async getAssetFromMetadataServer(params: { url: string; code: string; issuer: string; }): Promise<any> {
    return this.http.get<{ _embedded: { records: any[] } }>(params.url, {
      params: {
        code: params.code,
        issuer: params.issuer
      }
    }).pipe(take(1))
      .pipe(map(response => {
        return response?._embedded?.records[0];
      }))
      .toPromise();
  }

  addAssetToAccount(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    return this.simpleStateUpdateFlow(xdr, 'addingAsset');
  }

  removeAssetFromAccount(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    return this.simpleStateUpdateFlow(xdr, 'removingAsset');
  }

  /*
  * This method helps to generate de _id we use to identify assets in the store
  * */
  formatBalanceLineId(data: Horizon.BalanceLine | OfferAsset): IWalletAsset['_id'] {
    switch (data.asset_type) {
      case 'native':
        return 'native';

      case 'credit_alphanum4':
      case 'credit_alphanum12':
        return `${data.asset_code}_${data.asset_issuer}`;

      default:
        throw new Error('This type of address is not handled by this wallet');
    }
  }

  assetIdFromAssetString(asset: string): string {
    if (asset === 'native') {
      return 'native';
    } else {
      return `${asset.split(':')[0]}_${asset.split(':')[1]}`;
    }
  }

  sdkAssetFromAssetString(asset: string): Asset {
    if (asset === 'native') {
      return this.stellarSdkService.SDK.Asset.native();
    }

    const [code, issuer] = asset.split(':');

    return new this.stellarSdkService.SDK.Asset(code, issuer);
  }

  saveInitialAssetState(data: {
    _id: IWalletIssuedAsset['_id'];
    assetCode: IWalletIssuedAsset['assetCode'];
    assetIssuer: IWalletIssuedAsset['assetIssuer'];
    networkPassphrase: string;
  }): void {
    this.walletsAssetsStore.upsert(
      data._id,
      {
        _id: data._id,
        assetCode: data.assetCode,
        assetExtraDataLoaded: false,
        assetIssuer: data.assetIssuer,
        networkPassphrase: data.networkPassphrase,
      },
      (id, newEntity: any) => ({ ...newEntity, assetExtraDataLoaded: false }),
      {}
    );
  }

  nativeAssetDefaultRecord(): IWalletNativeAsset<'full'> {
    return {
      _id: 'native',
      assetCode: 'XLM',
      assetExtraDataLoaded: true,
      assetFullDataLoaded: true,
      domain: 'stellar.org',
      image: '/assets/images/stellar-logo.svg',
    };
  }

  /*
  * This method helps to generate an sdk Asset using the _id of the asset in our store
  * */
  sdkAssetFromAssetId(assetId: IWalletAsset['_id']): Asset {
    if (assetId === 'native') {
      return Asset.native();
    } else {
      const [assetCode, assetIssuer] = assetId.split('_');
      return new Asset(assetCode, assetIssuer);
    }
  }

  /*
  * This method is used to filter those balances we are not handling directly in the WalletAssetsStore
  * */
  filterBalancesLines(balances: Horizon.BalanceLine[]): BalanceAssetType[] {
    return balances
      .filter(balance =>
        balance.asset_type === 'native'
        || balance.asset_type === 'credit_alphanum4'
        || balance.asset_type === 'credit_alphanum12'
      ) as BalanceAssetType[];
  }

  async updateAssetPriceAgainstCounter(asset: IWalletAssetModel): Promise<void> {
    const counterAssetId = await this.settingsQuery.counterAssetId$.pipe(take(1)).toPromise();

    if (!counterAssetId) {
      return;
    }

    if (counterAssetId === asset._id) {
      this.walletsAssetsStore.upsert(asset._id, {
        counterPrice: '1',
        counterId: counterAssetId,
      });
      return;
    }

    let horizonResponse;
    try {
      horizonResponse = await this.stellarSdkService.Server.strictSendPaths(
        this.sdkAssetFromAssetId(asset._id),
        '1',
        [this.sdkAssetFromAssetId(counterAssetId)],
      )
        .limit(1)
        .call();
    } catch (e) {
      return;
    }

    const latestPrice = horizonResponse.records.shift();

    if (!latestPrice) {
      return;
    }

    this.walletsAssetsStore.upsert(asset._id, {
      counterPrice: latestPrice.destination_amount,
      counterId: counterAssetId,
    });
  }

  getCuratedAssetsByCreitTech(): Observable<ICuratedAsset[]> {
    this.curatedAssetsStore.updateUIState({ gettingCuratedListByCreitTech: true });
    return this.http.get<{ assets: IStellarCuratedAsset[] }>(`https://raw.githubusercontent.com/Creit-Tech/stellar-assets/main/dist/curated-by-creit-tech.json`)
      .pipe(map(response => {
        const parsedAssets = response.assets.map(asset => createCuratedAsset({
          ...asset,
          type: 'by_creit_tech',
        }));
        applyTransaction(() => {
          this.curatedAssetsStore.upsertMany(parsedAssets);
          this.curatedAssetsStore.updateUIState({ gettingCuratedListByCreitTech: false });
        });
        return parsedAssets;
      }))
      .pipe(catchError(e => {
        this.curatedAssetsStore.updateUIState({ gettingCuratedListByCreitTech: false });
        return throwError(e);
      }));
  }
}

export interface IStellarCuratedAsset {
  code: string;
  publicKey: string;
  domain: string;
  image: string;
}
