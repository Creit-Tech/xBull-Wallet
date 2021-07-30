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

}

export interface ITransaction {
  baseAccount: string;
  passphrase: string;
  operations: Operation[];
  fee: string;
  memo?: string;
}
