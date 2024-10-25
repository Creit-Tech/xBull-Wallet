import { Injectable } from '@angular/core';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { HttpClient } from '@angular/common/http';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { firstValueFrom, merge, Subject, throwError } from 'rxjs';
import { mergeAll, switchMap, take } from 'rxjs/operators';
import { HorizonApisQuery, WalletsAccountsQuery } from '~root/state';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { Networks } from '@stellar/stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class Sep10Service {

  constructor(
    private readonly stellarSdkService: StellarSdkService,
    private readonly http: HttpClient,
    private readonly nzModalService: NzModalService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly walletsService: WalletsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  async authenticateWithServer(
    url: string,
    params: { account: string; memo?: string; home_domain?: string; client_domain?: string }
  ): Promise<string> {
    let signedXdr;
    const challenge = await firstValueFrom(this.http.get<{ transaction: string; network_passphrase: Networks; }>(url, {
      params
    }));

    const walletAccountId = this.walletsService.generateWalletAccountId({
      publicKey: params.account,
      network: challenge.network_passphrase,
    });

    const account = this.walletsAccountsQuery.getEntity(walletAccountId);

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: challenge.transaction,
        pickedAccount: account,
        pickedNetworkPassphrase: challenge.network_passphrase,
        acceptHandler: (signed) => signedXdr = signed,
      },
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: 'Authentication Challenge',
    });

    await drawerRef.afterClose.pipe(take(1)).toPromise();

    if (!signedXdr) {
      throw new Error('Authentication failed');
    }

    const tokenResponse = await firstValueFrom(this.http.post<{ token: string }>(url, {
      transaction: signedXdr,
    }));

    return tokenResponse.token;
  }

  // async authenticateWithDomain(domain: string) {
  //   const tomlFile = await this.stellarSdkService.SDK.StellarTomlResolver.resolve(domain, { timeout: 5000 });
  // }
}
