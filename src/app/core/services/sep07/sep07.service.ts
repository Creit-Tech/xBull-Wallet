import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { QrScanModalComponent } from '~root/shared/shared-modals/components/qr-scan-modal/qr-scan-modal.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Networks } from 'soroban-client';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Sep07Service {

  constructor(
    private readonly nzModalService: NzModalService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly router: Router,
  ) { }

  validateStellarURI(uri: string): boolean {
    return (uri.startsWith('web+stellar:tx') || uri.startsWith('web+stellar:pay'));
  }

  /**
   * The pay operation doesn't allow the callback from the specification
   * The Message is not shown to the user, we believe that's something that can be exploited
   * Callback is not done for the "Pay" operation, for such cases dapps should use the "Transaction" operation
   * Signatures are not supported on any of the operations
   */
  handlePay(url: URL): void {
    const params: Sep07PayTransactionParams = {
      destination: url.searchParams.get('destination'),
      amount: url.searchParams.get('amount'),
      asset_code: url.searchParams.get('asset_code'),
      asset_issuer: url.searchParams.get('asset_issuer'),
      memo: url.searchParams.get('memo'),
      memo_type: url.searchParams.get('memo_type') as Sep07PayTransactionParams['memo_type'],
      // msg: url.searchParams.get('msg'),
      // network_passphrase: url.searchParams.get('network_passphrase') as Sep07PayTransactionParams['network_passphrase'],

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

    this.router.navigate(['/wallet/payment'], {
      queryParams: params,
    })
      .then();
  }

  async scanURI(): Promise<void> {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: 'Scan QR',
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: uri => {
          try {
            if (!this.validateStellarURI(uri)) {
              this.nzMessageService.error('Invalid URI', { nzDuration: 5000 });
              return;
            }

            const url = new URL(uri);
            const type = url.pathname;
            switch (url.pathname) {
              case Sep07TransactionTypes.Pay:
                this.handlePay(url);
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
  // msg: string | null;
  // network_passphrase: Networks | null;
  // origin_domain: string | null;
  // signature: string | null;
}
