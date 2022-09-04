import { Injectable } from '@angular/core';
import { Sep10Service } from '~root/core/services/sep10/sep-10.service';
import { createAnchor, IAnchor } from '~root/modules/anchors/state/anchor.model';
import { AnchorsStore } from '~root/modules/anchors/state/anchors.store';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnchorsAuthTokensStore } from '~root/modules/anchors/state/anchors-auth-tokens.store';
import { createAnchorsAuthToken } from '~root/modules/anchors/state/anchors-auth-token.model';

@Injectable()
export class AnchorsService {

  constructor(
    private readonly anchorsStore: AnchorsStore,
    private readonly anchorsAuthTokensStore: AnchorsAuthTokensStore,
    private readonly sep10Service: Sep10Service,
    private readonly http: HttpClient,
  ) { }

  addAnchor(anchorData: IAnchor): void {
    this.anchorsStore.upsert(anchorData._id, anchorData);
  }

  removeAnchor(id: IAnchor['_id']): void {
    this.anchorsStore.remove(id);
  }

  async authenticateWithAnchor(anchor: IAnchor, account: string): Promise<string> {
    const authToken =
      await this.sep10Service.authenticateWithServer(
        anchor.webAuthEndpoint,
        { account }
      );

    const newAnchorAuthToken = createAnchorsAuthToken({
      anchorId: anchor._id,
      publicKey: account,
      token: authToken,
    });

    this.anchorsAuthTokensStore.upsert(newAnchorAuthToken._id, newAnchorAuthToken);

    return authToken;
  }

  startInteractiveDeposit(params: IStartInteractiveParams): Observable<IStartInteractiveResponse> {
    const url = new URL(params.url);
    url.pathname = url.pathname + '/transactions/deposit/interactive';
    return this.http.post<IStartInteractiveResponse>(url.href, {
      account: params.account,
      amount: params.amount,
      asset_code: params.assetCode,
      asset_issuer: params.assetIssuer,
    }, {
      headers: { Authorization: `Bearer ${params.token}` },
    });
  }

  startInteractiveWithdraw(params: IStartInteractiveParams): Observable<IStartInteractiveResponse> {
    const url = new URL(params.url);
    url.pathname = url.pathname + '/transactions/withdraw/interactive';
    return this.http.post<IStartInteractiveResponse>(url.href, {
      account: params.account,
      asset_code: params.assetCode,
      asset_issuer: params.assetIssuer,
    }, {
      headers: { Authorization: `Bearer ${params.token}` },
    });
  }

  getAnchorTransactions(params: IGetAnchorTransactionsParams): Observable<IGetAnchorTransactionsResponse> {
    const url = new URL(params.url);
    url.pathname = url.pathname + '/transactions';
    return this.http.get<IGetAnchorTransactionsResponse>(url.href, {
      headers: { Authorization: `Bearer ${params.token}` },
      params: { asset_code: params.assetCode },
    });
  }
}

export interface IAnchorCurrency {
  code: string;
  issuer: string;
  image: string;
  deposit: {
    enabled: boolean;
    minAmount?: number;
    maxAmount?: number;
    feeFixed?: number;
    feePercentage?: number;
    feeMin?: number;
  };
  withdraw: {
    enabled: boolean;
    minAmount?: number;
    maxAmount?: number;
    feeFixed?: number;
    feePercentage?: number;
    feeMin?: number;
  };
}

export interface IStartInteractiveParams {
  url: string;
  token: string;
  amount: number;
  account: string;
  assetCode: string;
  assetIssuer?: string;
}

export interface IStartInteractiveResponse {
  id: string;
  url: string;
  type: string;
}

export interface IGetAnchorTransactionsParams {
  url: string;
  token: string;
  assetCode: string;
}

export interface IGetAnchorTransactionsResponse {
  transactions: Array<IAnchorDepositTransaction | IAnchorWithdrawTransaction>;
}

// Check later if is worth it to integrate these into the store
export interface IAnchorTransaction {
  id: string;
  status: 'incomplete' | 'pending_user_transfer_start' | 'pending_user_transfer_complete' | 'pending_external' | 'pending_anchor' | 'pending_stellar' | 'pending_trust' | 'pending_user' | 'completed' | 'refunded' | 'expired' | 'no_market' | 'too_small' | 'too_large' | 'error';
  status_eta?: number;
  kyc_verified?: boolean;
  more_info_url: string;
  amount_in: string;
  amount_in_asset?: string;
  amount_out: string;
  amount_out_asset: string;
  amount_fee: string;
  amount_fee_asset?: string;
  started_at: string;
  completed_at?: string;
  stellar_transaction_id: string;
  external_transaction_id?: string;
  message?: string;
  refunded?: boolean; // DEPRECATED
  refunds?: any;
}

export interface IAnchorDepositTransaction extends IAnchorTransaction {
  kind: 'deposit';
  deposit_memo?: string;
  deposit_memo_type?: string;
  from: string;
  to: string;
  claimable_balance_id?: string;
}

export interface IAnchorWithdrawTransaction extends IAnchorTransaction {
  kind: 'withdrawal';
  withdraw_anchor_account: string;
  withdraw_memo: string;
  withdraw_memo_type: 'text' | 'hash' |'id';
  from: string;
  to: string;
}
