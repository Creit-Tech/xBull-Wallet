import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { QrScanModalComponent } from '~root/shared/shared-modals/components/qr-scan-modal/qr-scan-modal.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Networks } from 'soroban-client';
import { Router } from '@angular/router';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { HorizonApisQuery, IHorizonApi, IWalletsAccount, WalletsAccountsQuery } from '~root/state';
import { map, take } from 'rxjs/operators';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class Sep07Service {

  constructor(
    private readonly nzModalService: NzModalService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsService: WalletsService,
    private readonly router: Router,
    private readonly httpClient: HttpClient,
    private readonly stellarSdkService: StellarSdkService,
    private readonly translateService: TranslateService,
  ) { }

  validateStellarURI(uri: string): boolean {
    return (uri.startsWith('web+stellar:tx') || uri.startsWith('web+stellar:pay'));
  }

  /**
   * The Message is not shown to the user, we believe that's something that can be exploited
   * Signatures are not supported
   * Chain value is not supported
   */
  async handlePay(url: URL): Promise<void> {
    const params: Sep07PayTransactionParams = {
      destination: url.searchParams.get('destination'),
      amount: url.searchParams.get('amount'),
      asset_code: url.searchParams.get('asset_code'),
      asset_issuer: url.searchParams.get('asset_issuer'),
      memo: url.searchParams.get('memo'),
      memo_type: url.searchParams.get('memo_type') as Sep07PayTransactionParams['memo_type'],
      callback: url.searchParams.get('callback'),
      // msg: url.searchParams.get('msg'),
      network_passphrase: url.searchParams.get('network_passphrase') as (Sep07PayTransactionParams['network_passphrase'] | null),

      // Currently we don't support both origin_domain and signature even doe we capture them here
      // origin_domain: url.searchParams.get('origin_domain'),
      // signature: url.searchParams.get('signature'),
    };

    if (!params.destination) {
      throw new Error('Destination parameter is required');
    }

    if (params.memo_type && params.memo_type !== 'MEMO_TEXT') {
      throw new Error('Currently the SEP7 integration only supports text type memo');
    }

    if (params.callback) {
      if (params.callback.startsWith('url:')) {
        params.callback = params.callback.replace('url:', '');
      } else {
        throw new Error('Unsupported type of callback');
      }
    }

    const selectedHorizonApi = await this.horizonApisQuery.getSelectedHorizonApi$
      .pipe(take(1))
      .toPromise();

    const pickedNetworkPassphrase: IHorizonApi['networkPassphrase'] = !!params.network_passphrase
      ? params.network_passphrase as IHorizonApi['networkPassphrase']
      : selectedHorizonApi.networkPassphrase;

    const pickedAccount = await this.walletsAccountsQuery.getSelectedAccount$
      .pipe(take(1))
      .toPromise();

    const loadedAccount = await this.stellarSdkService.selectServer()
      .loadAccount(pickedAccount.publicKey);

    const tx = new this.stellarSdkService.SDK.TransactionBuilder(
      loadedAccount,
      {
        fee: this.stellarSdkService.fee,
        networkPassphrase: pickedNetworkPassphrase,
        memo: params.memo ? this.stellarSdkService.SDK.Memo.text(params.memo) : undefined,
      }
    )
      .setTimeout(this.stellarSdkService.defaultTimeout)
      .addOperation(
        this.stellarSdkService.SDK.Operation.payment({
          asset: new this.stellarSdkService.SDK.Asset(
            params.asset_code as string,
            params.asset_issuer as string || undefined
          ),
          amount: new BigNumber(params.amount as string).toFixed(7),
          destination: params.destination,
        })
      )
      .build();

    this.nzMessageService.warning(
      `You're making a payment, review the transaction before confirming`,
      { nzDuration: 5000 }
    );

    await this.handleSigning({
      xdr: tx.toXDR(),
      callback: params.callback,
      pickedAccount,
      pickedNetworkPassphrase
    });
  }

  /**
   * The Message is not shown to the user, we believe that's something that can be exploited
   * Signatures are not supported
   * Chain value is not supported
   */
  async handleTx(url: URL): Promise<void> {
    const params: Sep07RegularTransactionParams = {
      xdr: url.searchParams.get('xdr'),
      pubkey: url.searchParams.get('pubkey'),
      callback: url.searchParams.get('callback'),
      network_passphrase: url.searchParams.get('network_passphrase') as (Networks | null),
    };

    if (!params.xdr) {
      throw new Error('"xdr" parameter is required');
    }

    if (params.callback) {
      if (params.callback.startsWith('url:')) {
        params.callback = params.callback.replace('url:', '');
      } else {
        throw new Error('Unsupported type of callback');
      }
    }

    const pickedNetworkPassphrase: IHorizonApi['networkPassphrase'] = !!params.network_passphrase
      ? params.network_passphrase as IHorizonApi['networkPassphrase']
      : await this.horizonApisQuery.getSelectedHorizonApi$
        .pipe(map(horizonApi => horizonApi.networkPassphrase))
        .pipe(take(1))
        .toPromise();

    let pickedAccount: IWalletsAccount;
    if (params.pubkey) {
      const accountId = this.walletsService.generateWalletAccountId({
        network: pickedNetworkPassphrase,
        publicKey: params.pubkey,
      });
      const searchedAccount = await this.walletsAccountsQuery.selectEntity(accountId)
        .pipe(take(1))
        .toPromise();

      if (!searchedAccount) {
        throw new Error('Public key is not registered in this wallet');
      }

      pickedAccount = searchedAccount;
    } else {
      pickedAccount = await this.walletsAccountsQuery.getSelectedAccount$
        .pipe(take(1))
        .toPromise();
    }

    await this.handleSigning({
      xdr: params.xdr,
      callback: params.callback,
      pickedAccount,
      pickedNetworkPassphrase
    });
  }

  async handleSigning(params: {
    xdr: string;
    pickedAccount: IWalletsAccount;
    pickedNetworkPassphrase: IHorizonApi['networkPassphrase'];
    callback: string | null;
  }): Promise<void> {
    const ref = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzPlacement: 'right',
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzContentParams: {
        xdr: params.xdr,
        pickedNetworkPassphrase: params.pickedNetworkPassphrase,
        pickedAccount: params.pickedAccount,
        signingResultsHandler: data => {
          if (params.callback) {
            this.handleCallback({ callback: params.callback, xdr: params.xdr });
            this.nzMessageService.success(`Signed transaction sent`);
          } else {
            const messageId = this.nzMessageService
              .loading('loading...', { nzDuration: 0 })
              .messageId;

            this.stellarSdkService.submit(data.transaction)
              .then(_ => {
                this.nzMessageService.remove(messageId);
                this.nzMessageService.success(
                  this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED')
                );
              })
              .catch(err => {
                this.nzMessageService.remove(messageId);
                this.nzModalService.error({
                  nzTitle: 'Oh oh!',
                  nzContent: this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'),
                });
              });
          }

          ref.close();
        }
      }
    });

    ref.open();
  }

  async handleCallback(params: { callback: string; xdr: string }): Promise<void> {
    this.httpClient.post(
      params.callback,
      'xdr=' + params.xdr,
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded;'),
      }
    ).subscribe();
  }

  async scanURI(): Promise<void> {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: 'Scan QR',
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: async uri => {
          try {
            if (!this.validateStellarURI(uri)) {
              this.nzMessageService.error('Invalid URI', { nzDuration: 5000 });
              return;
            }

            const url = new URL(uri);
            const type = url.pathname;
            switch (url.pathname) {
              case Sep07TransactionTypes.Pay:
                await this.handlePay(url);
                break;

              case Sep07TransactionTypes.Transaction:
                await this.handleTx(url);
                break;

              default:
                throw new Error(`Stellar URI type ${type} is not currently supported.`);
            }
          } catch (e: any) {
            this.nzMessageService.error(e.message, { nzDuration: 5000 });
          }

          drawerRef.close();
        }
      }
    });

    drawerRef.open();
  }
}

export enum Sep07TransactionTypes {
  Transaction = 'tx',
  Pay = 'pay',
}

export interface Sep07PayTransactionParams {
  destination: string | null;
  amount: string | null;
  asset_code: string | null;
  asset_issuer: string | null;
  memo: string | null;
  memo_type: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN' | null;
  callback: string | null;
  // msg: string | null;
  network_passphrase: Networks | null;
  // origin_domain: string | null;
  // signature: string | null;
}

export interface Sep07RegularTransactionParams {
  xdr: string | null;
  callback: string | null;
  pubkey: string | null;
  // chain: string | null;
  // msg: string | null;
  network_passphrase: Networks | null;
  // origin_domain: string | null;
  // signature: string | null;
}
