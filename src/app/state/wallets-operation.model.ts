import { AssetType, ServerApi } from 'stellar-sdk';
import { IWalletsAccount } from '~root/state/wallets-account.model';
import OperationRecord = ServerApi.OperationRecord;

interface ManageBuyOfferOperationResponse {
  id: string;
  paging_token: string;
  source_account: string;
  type: 'manage_buy_offer';
  type_i: 12;
  created_at: string;
  transaction_hash: string;
  offer_id: number | string;
  amount: string;
  buying_asset_type: AssetType;
  buying_asset_code?: string;
  buying_asset_issuer?: string;
  price: string;
  // price_r: PriceR;
  selling_asset_type: AssetType;
  selling_asset_code?: string;
  selling_asset_issuer?: string;
}

interface SetTrustLineFlagsOperationResponse {
  id: string;
  paging_token: string;
  source_account: string;
  type: 'set_trust_line_flags';
  type_i: 21;
  created_at: string;
  transaction_hash: string;
  asset_type: AssetType;
  asset_code: string;
  asset_issuer: string;
  trustor: string;
  set_flags: Array<1 | 2 | 4>;
  clear_flags: Array<1 | 2 | 4>;
}

export interface IWalletsOperation {
  _id: string;
  ownerAccount: IWalletsAccount['_id'];
  ownerPublicKey: IWalletsAccount['publicKey'];
  createdAt: number; // Unix time
  pagingToken: OperationRecord['paging_token'];
  operationRecord: OperationRecord | ManageBuyOfferOperationResponse | SetTrustLineFlagsOperationResponse;
}

export function createWalletsOperation(params: {
  ownerId: IWalletsAccount['_id'];
  ownerPublicKey: IWalletsAccount['publicKey'];
  operation: OperationRecord
}): IWalletsOperation {
  return {
    _id: params.operation.id,
    ownerAccount: params.ownerId,
    ownerPublicKey: params.ownerPublicKey,
    createdAt: new Date(params.operation.created_at).getTime(),
    pagingToken: params.operation.paging_token,
    operationRecord: params.operation,
  };
}
