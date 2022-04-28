import { Component, OnInit } from '@angular/core';
import {
  createSiteConnection,
  IWalletsAccount,
  SitesConnectionsQuery,
  WalletsAccountsQuery,
  WalletsQuery
} from '~root/state';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';
import { ConnectQuery } from '~root/modules/connect/state/connect.query';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, Validators } from '@angular/forms';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree/nz-tree-base-node';
import { ConnectService, EventType } from '~root/modules/connect/services/connect.service';
import { box, randomBytes } from 'tweetnacl';
import { decodeBase64, decodeUTF8, encodeBase64 } from 'tweetnacl-util';

@Component({
  selector: 'app-connect-account',
  templateUrl: './connect-account.component.html',
  styleUrls: ['./connect-account.component.scss']
})
export class ConnectAccountComponent implements OnInit {
  startDate$ = this.connectQuery.startDate$;
  origin$ = this.connectQuery.origin$;
  permissions$ = this.connectQuery.permissions$;

  openerPublicKey$ = this.connectQuery.openerPublicKey$;
  keypair$ = this.connectQuery.keypair$;

  currentStep$: Observable<number> = this.origin$
    .pipe(switchMap(origin => {
      return this.sitesConnectionsQuery.selectAll({
        filterBy: entity => entity.origin === origin && entity.canRequestPublicKey,
      })
        .pipe(map(results => results.length > 0));
    }))
    .pipe(map(alreadyConnected => alreadyConnected ? 1 : 0));

  accountSelectedControl: FormControl = new FormControl('', [Validators.required]);

  wallets$ = this.walletsQuery.selectAll();
  walletsAccounts$ = this.walletsAccountsQuery.selectAll();

  accountsNodes$: Observable<NzTreeNodeOptions[]> = combineLatest([
    this.wallets$,
    this.walletsAccounts$
  ])
    .pipe(map(([wallets, walletsAccounts]) => {
      const data = new Map<string, {
        name: string,
        accounts: Map<string, {
          name: string,
          publicKey: string
        }>
      }>();

      for (const wallet of wallets) {
        data.set(wallet._id, {
          name: wallet.name,
          accounts: new Map()
        });
      }

      for (const walletsAccount of walletsAccounts) {
        const wallet = data.get(walletsAccount.walletId);
        if (!wallet) {
          continue;
        }

        wallet.accounts.set(walletsAccount.publicKey, {
          name: walletsAccount.name,
          publicKey: walletsAccount.publicKey
        });

        data.set(walletsAccount.walletId, {
          name: wallet.name,
          accounts: wallet.accounts
        });
      }

      return data;
    }))
    .pipe(map(data => {
      return [...data.values()].map(wallet => {
        return {
          title: wallet.name,
          key: wallet.name,
          expanded: true,
          selectable: false,
          children: [...wallet.accounts.values()].map(account => {
            return {
              title: `${account.name} (G****${account.publicKey.slice(-4)})`,
              key: account.publicKey,
              isLeaf: true
            };
          }),
        };
      });
    }));

  constructor(
    private readonly sitesConnectionsService: SitesConnectionsService,
    private readonly sitesConnectionsQuery: SitesConnectionsQuery,
    private readonly connectQuery: ConnectQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly connectService: ConnectService,
  ) { }

  ngOnInit(): void {
    this.walletsAccountsQuery.getSelectedAccount$
      .pipe(filter<any>(Boolean))
      .pipe(take(1))
      .subscribe((value: IWalletsAccount) => {
        this.accountSelectedControl.setValue(value.publicKey);
      });
  }

  async onAcceptConnection(): Promise<void> {
    const origin = await this.origin$.pipe(take(1)).toPromise();
    if (!origin) {
      this.nzMessageService.error('Origin is undefined, we can not continue');
      return;
    }

    const permissions = await this.permissions$.pipe(take(1)).toPromise();

    if (!permissions) {
      this.nzMessageService.error('Permissions are not specified, we can not continue');
      return;
    }

    const url = new URL(origin);
    this.sitesConnectionsService.saveSiteConnection(createSiteConnection({
      _id: url.origin + '_' + url.host,
      origin: url.origin,
      host: url.host,
      createdAt: new Date().getTime(),
      ...permissions
    }));
  }

  async onConfirmShareAccount(): Promise<void> {
    const pkToShare = this.accountSelectedControl.value;

    if (!pkToShare) {
      this.nzMessageService.error('Select a public key before sending');
      return;
    }

    const [
      openerPublicKey,
      keypair,
    ] = await Promise.all([
      this.openerPublicKey$.pipe(take(1)).toPromise(),
      this.keypair$.pipe(take(1)).toPromise(),
    ]);

    if (!openerPublicKey) {
      this.nzMessageService.error('Public key from opener was not provided');
      return;
    }

    const payload = {
      publicKey: pkToShare,
    };

    const oneTimeCode = randomBytes(24);

    const encryptedPayload = box(
      decodeUTF8(JSON.stringify(payload)),
      oneTimeCode,
      decodeBase64(openerPublicKey),
      decodeBase64(keypair.secretKey),
    );

    opener.postMessage({
      type: EventType.XBULL_CONNECT_RESPONSE,
      message: encodeBase64(encryptedPayload),
      oneTimeCode: encodeBase64(oneTimeCode),
      publicKey: keypair.publicKey,
      success: true
    }, '*');
  }

  onReject(): void {
    this.connectService.rejectRequest(EventType.XBULL_CONNECT_RESPONSE);
  }

}
