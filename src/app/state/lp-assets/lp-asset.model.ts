import { Horizon } from 'stellar-sdk';

export interface ILpAssetBase {
  _id: string;
  dataLoaded: false;
}

export interface ILpAssetLoaded {
  _id: string;
  reserves: Horizon.Reserve[];
  totalShares: string;
  totalTrustlines: string;
  dataLoaded: true;
}

export type ILpAsset = ILpAssetBase | ILpAssetLoaded;

export function createLpAsset(params: ILpAsset): ILpAsset {
  return params;
}
