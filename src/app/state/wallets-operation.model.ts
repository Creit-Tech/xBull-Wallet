import { ServerApi } from 'stellar-sdk';
import { IWalletsAccount } from '~root/state/wallets-account.model';
import OperationRecord = ServerApi.OperationRecord;

export interface IWalletsOperation {
  _id: string;
  ownerAccount: IWalletsAccount['_id'];
  ownerPublicKey: IWalletsAccount['publicKey'];
  createdAt: number; // Unix time
  pagingToken: OperationRecord['paging_token'];
  operationRecord: OperationRecord;
}

export function createWalletsOperation(params: {
  ownerId: IWalletsAccount['_id'];
  ownerPublicKey: IWalletsAccount['publicKey'];
  operation: ServerApi.OperationRecord
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
