import { Inject, Injectable } from '@angular/core';
import { Horizon, Server, ServerApi, TransactionBuilder, Networks, Asset, StellarTomlResolver } from 'stellar-sdk';
import {
  BalanceAssetType,
  IHorizonApi,
  IWalletAsset,
  IWalletNativeAsset,
  IWalletsAccount, ILpAsset, LpAssetsStore,
  WalletsAssetsState,
  WalletsAssetsStore
} from '~root/state';
import { from, of } from 'rxjs';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { OfferAsset } from 'stellar-sdk/lib/types/offer';

@Injectable({
  providedIn: 'root'
})
export class WalletsAssetsService {
  // TODO: Make this optional before launching the app IE add a settings store

  constructor(
    private readonly walletsAssetsStore: WalletsAssetsStore,
    private readonly http: HttpClient,
    private readonly stellarSdkService: StellarSdkService,
    private readonly lpAssetsStore: LpAssetsStore,
  ) { }

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

        const newData: Partial<IWalletAsset<'issued', 'extra'>> = {
          amountIssued: assetRecord.amount,
          numAccount: assetRecord.num_accounts,
          assetExtraDataLoaded: true
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
      .pipe(map(([parsedToml, accountRecord]) => {
        const currencies = parsedToml.CURRENCIES || parsedToml.currencies;
        const documentation = parsedToml.DOCUMENTATION || parsedToml.documentation;
        const currency = currencies.find((c: any) => c.code === data.assetCode);

        this.walletsAssetsStore.upsert(
          data._id,
          {
            domain: accountRecord.home_domain,
            image: currency?.image,
            name: currency?.name,
            description: currency?.desc,
            conditions: currency?.conditions,
            orgName: documentation?.ORG_NAME,
            orgDba: documentation?.ORG_DBA,
            orgDescription: documentation?.ORG_DESCRIPTION,
            orgWebsite: documentation?.ORG_URL,
            orgAddress: documentation?.ORG_PHYSICAL_ADDRESS,
            orgOfficialEmail: documentation?.ORG_OFFICIAL_EMAIL,
            assetFullDataLoaded: true,
          }
        );
        return accountRecord;
      }));
  }

  getLiquidityPoolsData(params: {
    lpId: ILpAsset['_id'];
    horizonApi: IHorizonApi;
  }): Observable<ServerApi.LiquidityPoolRecord> {
    const recordPromise = new Server(params.horizonApi.url)
      .liquidityPools()
      .liquidityPoolId(params.lpId)
      .call();

    return from(recordPromise)
      .pipe(map(response => {
        this.lpAssetsStore.upsert(params.lpId, {
          dataLoaded: true,
          reserves: response.reserves,
          totalShares: response.total_shares,
          totalTrustlines: response.total_trustlines,
        });

        return response;
      }));
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
      .filter(balance => balance.asset_type !== 'liquidity_pool_shares') as BalanceAssetType[];
  }
}
