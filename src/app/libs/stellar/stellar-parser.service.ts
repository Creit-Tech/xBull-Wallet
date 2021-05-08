import { Injectable } from '@angular/core';
import { Operation, Transaction } from 'stellar-sdk';
import { IOperation, ITransaction } from '~root/libs/stellar/stellar-transaction-builder.service';
import { StellarSdkService } from '~root/libs/stellar/stellar-sdk.service';

@Injectable({
  providedIn: 'root'
})
export class StellarParserService {

  constructor(
    private readonly stellarSdk: StellarSdkService
  ) { }

  parseOperation(operation: Operation): IOperation {
    switch (operation.type) {
      case 'changeTrust':
        return {
          source: operation.source,
          limit: operation.limit,
          assetCode: operation.line.code,
          assetIssuer: operation.line.issuer,
          type: 'changeTrust',
        };

      default:
        throw new Error('We can not handle this kind of operation');
    }
  }

  parseFromXDRToTransactionInterface(xdr: string): ITransaction {
    const transaction = new Transaction(xdr, this.stellarSdk.networkPassphrase);
    return {
      fee: transaction.fee,
      baseAccount: transaction.source,
      operations: transaction.operations.map(operation => this.parseOperation(operation)),
      passphrase: transaction.networkPassphrase,
      // memo: transaction.memo.type === 'text' ?
    };
  }
}
