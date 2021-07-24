import { Horizon, ServerApi } from 'stellar-sdk';
import { IWalletsAccount } from '~root/state/wallets-account.model';
import PaymentOperationRecord = ServerApi.PaymentOperationRecord;
import { IWalletAsset } from '~root/state/wallets-asset.model';
import ChangeTrustOperationRecord = ServerApi.ChangeTrustOperationRecord;
import OperationRecord = ServerApi.OperationRecord;

export interface IWalletsOperationBase {
  _id: string;
  ownerAccount: IWalletsAccount['publicKey'];
  createdAt: number; // Unix time
  pagingToken?: OperationRecord['paging_token'];
  operationRecord?: OperationRecord;
  operationHandled: boolean; // this is a flag to be aware if we can handle this type operation IE we know how to parse it.
}

export interface IWalletsPaymentOperation extends IWalletsOperationBase {
  type: PaymentOperationRecord['type'];
  paymentType: 'send' | 'receive';
  publicAddress: string;
  amount: PaymentOperationRecord['amount'];
  assetCode: 'XLM' | string;
  assetIssuer?: string;
  assetId: IWalletAsset['_id'];
  operationRecord: PaymentOperationRecord;
}

export interface IWalletsChangeTrustOperation extends IWalletsOperationBase {
  type: ChangeTrustOperationRecord['type'];
  assetCode: IWalletAsset<'issued'>['assetCode'];
  assetIssuer: IWalletAsset<'issued'>['assetIssuer'];
  assetId: IWalletAsset<'issued'>['_id'];
  limit: string;
  operationRecord: ChangeTrustOperationRecord;
}

export type IWalletsOperation = IWalletsPaymentOperation
  | IWalletsChangeTrustOperation;

export function createWalletsOperation(params: ServerApi.OperationRecord & Pick<IWalletsOperationBase, 'ownerAccount'>): IWalletsOperation {
  const { ownerAccount, ...operationRecord } = params;
  let finalObj: any = {
    _id: operationRecord.id,
    ownerAccount,
    createdAt: new Date(operationRecord.created_at).getTime(),
    pagingToken: operationRecord.paging_token,
    operationRecord,
    operationHandled: false,
  };

  switch (operationRecord.type) {
    case Horizon.OperationResponseType.createAccount:
      finalObj = {
        ...finalObj,
        operationHandled: true,
      };
      break;

    case Horizon.OperationResponseType.payment:
      finalObj = {
        ...finalObj,
        assetId: operationRecord.asset_type === 'native' ? 'native' : `${operationRecord.asset_code}_${operationRecord.asset_issuer}`,
        type: operationRecord.type,
        paymentType: ownerAccount === operationRecord.source_account ? 'send' : 'receive',
        publicAddress: ownerAccount === operationRecord.source_account ? operationRecord.to : operationRecord.from,
        amount: operationRecord.amount,
        assetCode: operationRecord.asset_type === 'native' ? 'XLM' : operationRecord.asset_code,
        assetIssuer: operationRecord.asset_issuer,
        operationRecord,
        operationHandled: true,
      };
      break;

    // case Horizon.OperationResponseType.changeTrust:
    //

    default:
      console.warn('We ca not handle this type of operation yet.');
  }
  return finalObj;
}
