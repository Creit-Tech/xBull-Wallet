// TODO: Probably we will need to refactor this

declare type AssetType = 'native' | 'issued';
declare type AssetStatus = 'unloaded' | 'extra' | 'full';

interface IBaseNativeAsset {
  _id: 'native';
  assetCode: 'XLM';
}

interface INativeAsset extends IBaseNativeAsset {
  assetExtraDataLoaded: false;
  assetFullDataLoaded: false;
}

interface INativeAssetExtra extends IBaseNativeAsset {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: false;
}

interface INativeAssetFull extends IBaseNativeAsset {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: true;
  domain: string;
  image: string;
}

interface IBaseIssuedAsset {
  _id: string; // This must be `${asset_code}_${asset_issuer}`
  assetCode: string;
  assetIssuer: string;
}

interface IIssuedAsset extends IBaseIssuedAsset {
  assetExtraDataLoaded: false;
  assetFullDataLoaded: false;
}

interface IIssuedAssetExtra extends IBaseIssuedAsset {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: false;
  amountIssued: string;
  numAccount: number;
}

interface IIssuedAssetFull extends IBaseIssuedAsset {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: true;
  amountIssued: string;
  numAccount: number;
  domain?: string;
  image?: string;
  name?: string;
  description?: string;
  conditions?: string;
  orgName?: string;
  orgDba?: string;
  orgDescription?: string;
  orgWebsite?: string;
  orgAddress?: string;
  orgOfficialEmail?: string;
}

export type IWalletNativeAsset<T extends AssetStatus = AssetStatus> = T extends 'unloaded'
  ? INativeAsset
  : T extends 'extra'
    ? INativeAssetExtra
    : T extends 'full'
      ? INativeAssetFull
      : INativeAsset | INativeAssetExtra | INativeAssetFull;

export type IWalletIssuedAsset<T extends AssetStatus = AssetStatus> = T extends 'unloaded'
  ? IIssuedAsset
  : T extends 'extra'
    ? IIssuedAssetExtra
    : T extends 'full'
      ? IIssuedAssetFull
      : IIssuedAsset | IIssuedAssetExtra | IIssuedAssetFull;


export type IWalletAsset<T extends AssetType = AssetType, R extends AssetStatus = AssetStatus> = T extends 'native'
  ? IWalletNativeAsset<R>
  : T extends 'issued'
    ? IWalletIssuedAsset<R>
    : IWalletNativeAsset<R> | IWalletIssuedAsset<R>;