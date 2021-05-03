declare type AssetType = 'native' | 'issued';

interface IBaseNativeAsset {
  _id: 'native';
  assetCode: 'XLM';
}

export interface IBaseIssuedAsset {
  _id: string; // This must be `${asset_code}_${asset_issuer}`
  assetCode: string;
  assetIssuer: string;
}

export type IWalletBaseAsset<T extends AssetType = AssetType> = T extends 'native'
  ? IBaseNativeAsset
  : T extends 'issued'
    ? IBaseIssuedAsset
    : IBaseNativeAsset | IBaseIssuedAsset;

declare type AssetStatus = 'unloaded' | 'extra' | 'full';

interface IUnloadedStatus {
  assetExtraDataLoaded: false;
  assetFullDataLoaded: false;
}

interface IExtraDataLoadedStatus {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: false;
  amountIssued: string;
  numAccount: number;
}

interface IFullDataLoadedStatus {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: true;
  domain: string;
  image: string;
}

export type IWalletAssetStatus<T extends AssetStatus = AssetStatus> =
  T extends 'unloaded'
    ? IUnloadedStatus
    : T extends 'extra'
      ? IExtraDataLoadedStatus
      : T extends 'full'
        ? IFullDataLoadedStatus
        : IUnloadedStatus | IExtraDataLoadedStatus | IFullDataLoadedStatus;

export type IWalletAsset<T extends AssetStatus = AssetStatus, R extends AssetType = AssetType>
  = IWalletBaseAsset<R> & IWalletAssetStatus<T>;
