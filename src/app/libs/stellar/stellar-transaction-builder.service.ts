import { Injectable } from '@angular/core';
import { TransactionBuilder, Operation, Asset } from 'stellar-sdk';
import { StellarSdkService } from '~root/libs/stellar/stellar-sdk.service';

@Injectable({
  providedIn: 'root'
})
export class StellarTransactionBuilderService {

  constructor(
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  addOperation(params: { builder: TransactionBuilder, operation: IOperation }): TransactionBuilder {
    switch (params.operation.type) {
      case 'changeTrust':
        params.builder.addOperation(
          Operation.changeTrust({
            asset: params.operation.assetCode === 'native'
              ? Asset.native()
              : new Asset(params.operation.assetCode, params.operation.assetIssuer),
            source: params.operation.source,
            limit: params.operation.limit
          })
        );
    }

    return params.builder;
  }

  // async generateTransactionXDR(params: ITransaction): Promise<string> {
  //   const baseAccount = await this.stellarSdkService.Server.loadAccount(params.baseAccount);
  //
  //   if (!params.fee) {
  //     const ledger = await this.stellarSdkService.Server
  //       .ledgers()
  //       .order('desc')
  //       .limit(1)
  //       .call();
  //
  //     params.fee = ledger.records.shift()?.base_fee.toString() || '100';
  //   }
  //
  //   const transaction = new TransactionBuilder(baseAccount, {
  //     fee: params.fee,
  //     networkPassphrase: params.passphrase,
  //   });
  //
  //   for (const operation of params.operations) {
  //     this.addOperation({ builder: transaction, operation });
  //   }
  //
  //   const builtTransaction = transaction.build();
  //
  //   return builtTransaction.toXDR();
  // }
}

export type IOperationType = 'changeTrust' | 'payment';

export interface IChangeTrustOperation {
  type: 'changeTrust';
  assetCode: string;
  assetIssuer: string;
  limit?: string;
  source?: string;
}

export interface IPaymentOperation {
  type: 'payment';
  destination: string;
  assetCode: string;
  assetIssuer: string;
  amount: string;
  source?: string;
}

export type IOperation = IChangeTrustOperation |
  IPaymentOperation;

export interface ITransaction {
  baseAccount: string;
  passphrase: string;
  operations: IOperation[];
  fee: string;
  memo?: string;
}
