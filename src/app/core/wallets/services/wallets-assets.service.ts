import { Injectable } from '@angular/core';
import { Horizon, Server, ServerApi } from 'stellar-sdk';
import { IWalletAsset, WalletsAssetsStore } from '~root/core/wallets/state';
import { from, of } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';
import { applyTransaction, withTransaction } from '@datorama/akita';
import { HttpClient } from '@angular/common/http';
import { parse } from 'toml';

@Injectable({
  providedIn: 'root'
})
export class WalletsAssetsService {
  // TODO: Make this optional before launching the app IE add a settings store
  get Server(): Server {
    return new Server('https://horizon-testnet.stellar.org');
  }

  constructor(
    private readonly walletsAssetsStore: WalletsAssetsStore,
    private readonly http: HttpClient,
  ) { }

  getAssetExtraRecord(asset: IWalletAsset<'unloaded', 'issued'>): Observable<ServerApi.AssetRecord> {
    const recordPromise = this.Server.assets()
      .forCode(asset.assetCode)
      .forIssuer(asset.assetIssuer)
      .call();

    return from(recordPromise)
      .pipe(map(response => response.records.shift()))
      .pipe(map(assetRecord => {
        if (!assetRecord) {
          throw new Error(`We couldn't get the record for the asset ${asset._id}`);
        }

        const newData: Partial<IWalletAsset<'extra', 'issued'>> = {
          amountIssued: assetRecord.amount,
          numAccount: assetRecord.num_accounts,
          assetExtraDataLoaded: true
        };

        this.walletsAssetsStore.upsert(asset._id, newData);

        return assetRecord;
      }));
  }

  getAssetFullRecord(asset: IWalletAsset<'extra', 'issued'>): Observable<ServerApi.AccountRecord> {
    const recordPromise = this.Server.accounts()
      .accountId(asset.assetIssuer)
      .call();

    return from(recordPromise)
      .pipe(switchMap(accountRecord => {
        return this.http.get(`https://${accountRecord.home_domain}/.well-known/stellar.toml`, {
          responseType: 'text'
        })
          .pipe(withLatestFrom(of(accountRecord)));
      }))
      .pipe(map(([tolm, accountRecord]) => {
        const parsedTolm = parse(tolm);
        const currencies = parsedTolm.CURRENCIES || parsedTolm.currencies;
        const currency = currencies.find((c: any) => c.code === asset.assetCode);

        this.walletsAssetsStore.upsert(
          asset._id,
          {
            domain: accountRecord.home_domain,
            image: currency.image
          }
        );
        return accountRecord;
      }));
  }

  /*
  * This method helps to generate de _id we use to identify assets in the store
  * */
  formatBalanceLineId(data: Horizon.BalanceLine): IWalletAsset['_id'] {
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

  nativeAssetDefaultRecord(): IWalletAsset<'full', 'native'> {
    return {
      _id: 'native',
      assetCode: 'XLM',
      assetExtraDataLoaded: true,
      assetFullDataLoaded: true,
      domain: 'stellar.org',
      image: '/assets/images/stellar-logo.svg'
    };
  }
}
