import { Horizon } from '@stellar/stellar-sdk';

export interface ILpAssetBase {
  _id: string;
  dataLoaded: false;
}

export interface ILpAssetLoaded {
  _id: string;
  reserves: Horizon.HorizonApi.Reserve[];
  totalShares: string;
  totalTrustlines: string;
  dataLoaded: true;
  fee_bp: number;
}

export type ILpAsset = ILpAssetBase | ILpAssetLoaded;

export function createLpAsset(params: ILpAsset): ILpAsset {
  return params;
}
