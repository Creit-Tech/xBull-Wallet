// TODO: Probably we will need to refactor this

import { Horizon } from '@stellar/stellar-sdk';
import BalanceLine = Horizon.HorizonApi.BalanceLine;

declare type AssetType = 'native' | 'issued';
declare type AssetStatus = 'unloaded' | 'extra' | 'full';

export type BalanceAssetType = BalanceLine<'native'> | BalanceLine<'credit_alphanum4'> | BalanceLine<'credit_alphanum12'>
// DEPRECATED
interface IBaseNativeAsset {
  _id: 'native';
  assetCode: 'XLM';
  lastTimeUpdated?: Date;

  assetExtraDataLoaded?: boolean;
  assetFullDataLoaded?: boolean;
  domain?: string;
  image?: string;
}
// DEPRECATED
interface INativeAsset extends IBaseNativeAsset {
  assetExtraDataLoaded: false;
  assetFullDataLoaded: false;
}
// DEPRECATED
interface INativeAssetExtra extends IBaseNativeAsset {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: false;
}
// DEPRECATED
interface INativeAssetFull extends IBaseNativeAsset {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: true;
  domain: string;
  image: string;
}
// DEPRECATED
interface IBaseIssuedAsset {
  _id: string; // This must be `${asset_code}_${asset_issuer}`
  assetCode: string;
  assetIssuer: string;
  lastTimeUpdated?: Date;

  assetExtraDataLoaded?: boolean;
  assetFullDataLoaded?: boolean;

  amountIssued?: string;
  numAccount?: number;

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
// DEPRECATED
interface IIssuedAsset extends IBaseIssuedAsset {
  assetExtraDataLoaded: false;
  assetFullDataLoaded: false;
}
// DEPRECATED
interface IIssuedAssetExtra extends IBaseIssuedAsset {
  assetExtraDataLoaded: true;
  assetFullDataLoaded: false;
  amountIssued: string;
  numAccount: number;
}
// DEPRECATED
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

export interface IWalletAssetModel {
  _id: 'native' | string; // This must be `${asset_code}_${asset_issuer}`
  assetCode: 'XLM' | string;
  assetIssuer: string;

  domain?: string;

  notInToml?: boolean;

  lastTimeUpdated?: Date;

  counterPrice?: string;
  counterId?: string;

  assetExtraDataLoaded?: boolean;
  assetFullDataLoaded?: boolean;

  amountIssued?: string;
  numAccount?: number;

  // Currency details
  code_template?: string;
  status?: 'live' | 'dead' | 'test' | 'private';
  display_decimals?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name?: string;
  desc?: string;
  conditions?: string;
  image?: string;
  fixed_number?: number;
  max_number?: number;
  is_unlimited?: boolean;
  is_asset_anchored?: boolean;
  anchor_asset_type?: 'iat' | 'crypto' | 'nft' | 'stock' | 'bond' | 'commodity' | 'realestate' | 'other';
  anchor_asset?: string;
  attestation_of_reserve?: string;
  redemption_instructions?: string;
  collateral_addresses?: string[];
  collateral_address_messages?: string[];
  collateral_address_signatures?: string[];
  regulated?: boolean;
  approval_server?: string;
  approval_criteria?: string;


  // Org details
  orgName?: string;
  orgDba?: string;
  orgDescription?: string;
  orgWebsite?: string;
  orgAddress?: string;
  orgOfficialEmail?: string;

  networkPassphrase: string;
}

// DEPRECATED
export type IWalletNativeAsset<T extends AssetStatus = AssetStatus> = T extends 'unloaded'
  ? INativeAsset
  : T extends 'extra'
    ? INativeAssetExtra
    : T extends 'full'
      ? INativeAssetFull
      : INativeAsset | INativeAssetExtra | INativeAssetFull;
// DEPRECATED
export type IWalletIssuedAsset<T extends AssetStatus = AssetStatus> = T extends 'unloaded'
  ? IIssuedAsset
  : T extends 'extra'
    ? IIssuedAssetExtra
    : T extends 'full'
      ? IIssuedAssetFull
      : IIssuedAsset | IIssuedAssetExtra | IIssuedAssetFull;

// DEPRECATED
export type IWalletAsset<T extends AssetType = AssetType, R extends AssetStatus = AssetStatus> = T extends 'native'
  ? IWalletNativeAsset<R>
  : T extends 'issued'
    ? IWalletIssuedAsset<R>
    : IWalletNativeAsset<R> | IWalletIssuedAsset<R>;

export const parseCurrencyDetails = (data?: { [x: string]: any }) => {
  return {
    notInToml: !data,
    code_template: data?.code_template,
    status: data?.status,
    display_decimals: data?.display_decimals,
    name: data?.name,
    desc: data?.desc,
    conditions: data?.conditions,
    image: data?.image,
    fixed_number: data?.fixed_number,
    max_number: data?.max_number,
    is_unlimited: data?.is_unlimited,
    is_asset_anchored: data?.is_asset_anchored,
    anchor_asset_type: data?.anchor_asset_type,
    anchor_asset: data?.anchor_asset,
    attestation_of_reserve: data?.attestation_of_reserve,
    redemption_instructions: data?.redemption_instructions,
    collateral_addresses: data?.collateral_addresses,
    collateral_address_messages: data?.collateral_address_messages,
    collateral_address_signatures: data?.collateral_address_signatures,
    regulated: data?.regulated,
    approval_server: data?.approval_server,
    approval_criteria: data?.approval_criteria,
  };
};
