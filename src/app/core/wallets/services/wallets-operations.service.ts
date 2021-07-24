import { Injectable } from '@angular/core';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { createWalletsOperation, IWalletsAccount, WalletsOperationsStore } from '~root/state';
import { Horizon, Operation, ServerApi, Transaction, Memo } from 'stellar-sdk';
import OperationRecord = ServerApi.OperationRecord;
import { applyTransaction } from '@datorama/akita';

@Injectable({
  providedIn: 'root'
})
export class WalletsOperationsService {

  constructor(
    private readonly walletsOperationsStore: WalletsOperationsStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  // TODO: Rethink the operations flow we have used
  // parseOperation(operation: Operation): IOperation {
  //   switch (operation.type) {
  //     case 'changeTrust':
  //       return {
  //         type: 'changeTrust',
  //         source: operation.source,
  //         limit: operation.limit,
  //         assetCode: operation.line.code,
  //         assetIssuer: operation.line.issuer,
  //       };
  //
  //     case 'payment':
  //       return {
  //         type: 'payment',
  //         destination: operation.destination,
  //         assetCode: operation.asset.code,
  //         assetIssuer: operation.asset.issuer,
  //         amount: operation.amount,
  //         source: operation.source,
  //       };
  //
  //     default:
  //       throw new Error('We can not handle this kind of operation');
  //   }
  // }

  parseMemo(memo: Memo): string | undefined {
    if (!memo.value) {
      return;
    }

    return Buffer.from(memo.value).toString();
  }

  parseFromXDRToTransactionInterface(xdr: string): ITransaction {
    const transaction = new Transaction(xdr, this.stellarSdkService.networkPassphrase);
    return {
      fee: transaction.fee,
      baseAccount: transaction.source,
      operations: transaction.operations,
      passphrase: transaction.networkPassphrase,
      memo: this.parseMemo(transaction.memo),
    };
  }

  sendPayment(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    this.walletsOperationsStore.update(state => ({ ...state, sendingPayment: true }));
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.walletsOperationsStore.update(state => ({ ...state, sendingPayment: false }));
        return response;
      })
      .catch(error => {
        this.walletsOperationsStore.update(state => ({ ...state, sendingPayment: false }));
        return Promise.reject(error);
      });
  }

  createStream(params: {
    account: IWalletsAccount,
    order: 'asc' | 'desc',
    cursor?: string,
  }): void {
    if (params.account && !params.account.operationsStreamCreated) {
      const streamBuilder = this.stellarSdkService.Server.operations()
        .forAccount(params.account.publicKey)
        .limit(10)
        .includeFailed(false);

      streamBuilder.order(params.order);

      if (!!params.cursor) {
        streamBuilder.cursor(params.cursor);
      }

      streamBuilder
        .stream({
          onmessage: (operationRecord: any) => {
            this.walletsOperationsStore.upsertMany([createWalletsOperation({
              ...operationRecord,
              ownerAccount: params.account.publicKey,
            })]);
          }
        });
    }
  }

}


// export type IOperationType = 'changeTrust' | 'payment';
//
// export interface IChangeTrustOperation {
//   type: 'changeTrust';
//   assetCode: string;
//   assetIssuer: string;
//   limit?: string;
//   source?: string;
// }
//
// export interface IPaymentOperation {
//   type: 'payment';
//   destination: string;
//   assetCode: string;
//   assetIssuer: string;
//   amount: string;
//   source?: string;
// }
//
// export type IOperation = IChangeTrustOperation |
//   IPaymentOperation;

export interface ITransaction {
  baseAccount: string;
  passphrase: string;
  // operations: IOperation[];
  operations: Operation[];
  fee: string;
  memo?: string;
}
