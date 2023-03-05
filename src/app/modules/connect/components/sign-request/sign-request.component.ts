import { Component, OnInit } from '@angular/core';
import { ConnectQuery } from '~root/modules/connect/state/connect.query';
import { HorizonApisQuery, WalletsAccountsQuery } from '~root/state';
import { map, pluck, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { Networks } from 'soroban-client';
import { ConnectService, EventType } from '~root/modules/connect/services/connect.service';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { box, randomBytes } from 'tweetnacl';
import { decodeBase64, decodeUTF8, encodeBase64 } from 'tweetnacl-util';

@Component({
  selector: 'app-sign-request',
  templateUrl: './sign-request.component.html',
  styleUrls: ['./sign-request.component.scss']
})
export class SignRequestComponent implements OnInit {
  startDate$ = this.connectQuery.startDate$;
  origin$ = this.connectQuery.origin$;
  openerPublicKey$ = this.connectQuery.openerPublicKey$;
  keypair$ = this.connectQuery.keypair$;

  networkPassphraseToUse$ = this.connectQuery.networkPassphraseToUse$
    .pipe(switchMap(network => {
      if (!!network) {
        return of(network);
      }

      return this.horizonApisQuery.getSelectedHorizonApi$
        .pipe(pluck('networkPassphrase'));
    }));

  networkName$ = this.networkPassphraseToUse$
    .pipe(map(network => {
      return this.horizonApisService.userNetworkName(network);
    }));

  account$ = this.connectQuery.accountIdToUse$
    .pipe(switchMap(id => {
      if (!!id) {
        return this.walletsAccountsQuery.selectEntity(id);
      } else {
        return this.walletsAccountsQuery.getSelectedAccount$;
      }
    }));

  xdr$ = this.connectQuery.xdr$;

  constructor(
    private readonly connectQuery: ConnectQuery,
    private readonly connectService: ConnectService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly horizonApisService: HorizonApisService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
  }

  async onAccept(): Promise<void> {
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

    const xdr = await this.xdr$.pipe(take(1)).toPromise();
    if (!xdr) {
      this.nzMessageService.error('There was no XDR provided.');
      return;
    }

    const accountId = await this.connectQuery.accountIdToUse$.pipe(take(1)).toPromise();

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: 'Sign transaction',
      nzContentParams: {
        xdr,
        pickedAccount: this.walletsAccountsQuery.getEntity(accountId),
        pickedNetworkPassphrase: await this.networkPassphraseToUse$.pipe(take(1)).toPromise(),
        acceptHandler: signedXdr => {
          const payload = {
            xdr: signedXdr,
          };

          const oneTimeCode = randomBytes(24);

          const encryptedPayload = box(
            decodeUTF8(JSON.stringify(payload)),
            oneTimeCode,
            decodeBase64(openerPublicKey),
            decodeBase64(keypair.secretKey),
          );

          opener.postMessage({
            type: EventType.XBULL_SIGN_RESPONSE,
            message: encodeBase64(encryptedPayload),
            oneTimeCode: encodeBase64(oneTimeCode),
            publicKey: keypair.publicKey,
            success: true
          }, '*');
        }
      },
    });
  }

  onReject(): void {
    this.connectService.rejectRequest(EventType.XBULL_SIGN_RESPONSE);
  }

}
