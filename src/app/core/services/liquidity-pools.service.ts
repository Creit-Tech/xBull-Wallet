import { Injectable } from '@angular/core';
import { IHorizonApi, ILpAsset, ILpAssetLoaded, LpAssetsStore } from '~root/state';
import { Server, Asset, Horizon, ServerApi } from 'stellar-sdk';
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

  async getLiquidityPoolsData(params: {
    lpId: ILpAsset['_id'];
    horizonApi: IHorizonApi;
  }): Promise<ServerApi.LiquidityPoolRecord> {
    const record = await new Server(params.horizonApi.url)
      .liquidityPools()
      .liquidityPoolId(params.lpId)
      .call();

    this.lpAssetsStore.upsert(params.lpId, {
      dataLoaded: true,
      reserves: record.reserves,
      totalShares: record.total_shares,
      totalTrustlines: record.total_trustlines,
      fee_bp: record.fee_bp,
    });

    return record;
  }

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

  withdrawLiquidity(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    this.lpAssetsStore.updateUIState({ withdrawingLiquidity: true });
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.lpAssetsStore.updateUIState({ withdrawingLiquidity: false });
        return response;
      })
      .catch(error => {
        this.lpAssetsStore.updateUIState({ withdrawingLiquidity: false });
        return Promise.reject(error);
      });
  }

  // Get the assets in order to create the trustline
  orderAssets(A: Asset, B: Asset): Asset[] {
    return (this.stellarSdkService.SDK.Asset.compare(A, B) <= 0) ? [A, B] : [B, A];
  }
}
