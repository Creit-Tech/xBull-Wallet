import { Injectable } from '@angular/core';
import { IHorizonApi, ILpAssetLoaded, LpAssetsStore } from '~root/state';
import { Server, Asset, Horizon } from 'stellar-sdk';
import {from, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import { withTransaction } from '@datorama/akita';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';

@Injectable({
  providedIn: 'root'
})
export class LiquidityPoolsService {

  constructor(
    private readonly lpAssetsStore: LpAssetsStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  // getLatestPools(data: { horizonApi: IHorizonApi }): Observable<ILpAssetLoaded[]> {
  getPoolsByAssets(data: { assets: Asset[], horizonApi: IHorizonApi }): Observable<ILpAssetLoaded[]> {
    this.lpAssetsStore.updateUIState({ fetchingLatestPools: true });
    const serverCall = new this.stellarSdkService.SDK.Server(data.horizonApi.url)
      .liquidityPools()
      .forAssets(...data.assets)
      .limit(100)
      .order('desc')
      .call();

    return from(serverCall)
      .pipe(map(response => {
        return response.records.map((record): ILpAssetLoaded => ({
          _id: record.id,
          reserves: record.reserves,
          fee_bp: record.fee_bp,
          dataLoaded: true,
          totalShares: record.total_shares,
          totalTrustlines: record.total_trustlines,
        }));
      }))
      .pipe(withTransaction(lpAssets => {
        this.lpAssetsStore.set(lpAssets);
        this.lpAssetsStore.updateUIState({ fetchingLatestPools: false });
      }))
      .pipe(catchError(response => {
        this.lpAssetsStore.updateUIState({ fetchingLatestPools: false });
        return throwError(response);
      }));
  }

  depositLiquidity(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    this.lpAssetsStore.updateUIState({ depositingLiquidity: true });
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.lpAssetsStore.updateUIState({ depositingLiquidity: false });
        return response;
      })
      .catch(error => {
        this.lpAssetsStore.updateUIState({ depositingLiquidity: false });
        return Promise.reject(error);
      });
  }
}
