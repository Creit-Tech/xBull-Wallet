import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, take, takeUntil } from 'rxjs/operators';
import { box, randomBytes } from 'tweetnacl';
import { NzMessageService } from 'ng-zorro-antd/message';
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';
import { Subject, Subscription } from 'rxjs';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { ConnectQuery } from '~root/modules/connect/state/connect.query';
import { ConnectStateFlow } from '~root/modules/connect/state/connect.store';
import { ConnectService, EventType, IEventData } from '~root/modules/connect/services/connect.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { WalletsAccountsQuery } from '~root/state';
import { selectPersistStateInit } from '@datorama/akita';

@Component({
  selector: 'app-connect-dashboard',
  templateUrl: './connect-dashboard.component.html',
  styleUrls: ['./connect-dashboard.component.scss']
})
export class ConnectDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  now = new Date();
  componentDestroyed$: Subject<void> = new Subject<void>();
  eventMessage$: Subject<MessageEvent<any>> = new Subject<MessageEvent<any>>();
  private localSession$ = this.connectQuery.localSession$;

  keypair$ = this.connectQuery.keypair$;

  connectAccountFlow$ = this.connectQuery.stateFlow$
    .pipe(map(stateFlow => stateFlow === ConnectStateFlow.CONNECT));

  signFlow$ = this.connectQuery.stateFlow$
    .pipe(map(stateFlow => stateFlow === ConnectStateFlow.SIGN));

  // These are in base64
  private openerPublicKey$ = this.connectQuery.openerPublicKey$;
  private openerSession$ = this.connectQuery.openerSession$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly connectQuery: ConnectQuery,
    private readonly walletsService: WalletsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly connectService: ConnectService,
  ) { }

  eventMessagesSubscription: Subscription = this.eventMessage$.asObservable()
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(async event => {
      switch (event?.data?.type as EventType) {
        case EventType.XBULL_CONNECT:
          await this.handleConnectRequest(event);
          return;

        case EventType.XBULL_SIGN:
          await this.handleSignRequest(event);
          return;

        default:
          return;
      }
    });

  ngOnInit(): void {
    this.route.queryParams
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(params => {
        this.connectService.setInitialState({
          openerSession: decodeURIComponent(params.session),
          openerPublicKey: decodeURIComponent(params.public)
        });
      });

    window.addEventListener('message', (event) => {
      this.eventMessage$.next(event);
    }, false);
  }

  ngAfterViewInit(): void {
    this.generateAndSendConnectionId().then();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async generateAndSendConnectionId(): Promise<void> {
    const openerPublicKey = await this.openerPublicKey$.pipe(take(1)).toPromise();
    const openerSession = await this.openerSession$.pipe(take(1)).toPromise();
    const localSession = await this.localSession$.pipe(take(1)).toPromise();
    const keypair = await this.keypair$.pipe(take(1)).toPromise();

    if (!openerPublicKey) {
      this.nzMessageService.error('Public key from opener was not provided');
      return;
    }

    if (!openerSession) {
      this.nzMessageService.error('Session from opener was not provided');
      return;
    }

    if (!localSession) {
      this.nzMessageService.error('There was an error while generating the local session ID');
      return;
    }

    const payload = {
      providedSession: openerSession,
      walletSession: localSession,
    };

    const oneTimeCode = randomBytes(24);

    const encryptedPayload = box(
      decodeUTF8(JSON.stringify(payload)),
      oneTimeCode,
      decodeBase64(openerPublicKey),
      decodeBase64(keypair.secretKey),
    );

    opener.postMessage({
      type: EventType.XBULL_INITIAL_RESPONSE,
      message: encodeBase64(encryptedPayload),
      oneTimeCode: encodeBase64(oneTimeCode),
      publicKey: keypair.publicKey,
    }, '*');
  }

  async handleConnectRequest(event: MessageEvent<IEventData>): Promise<void> {
    const message = await this.decryptEventMessage(event);

    this.connectService.setConnectAccountFlow({
      origin: event.origin,
      permissions: message
    });
  }

  async handleSignRequest(event: MessageEvent<IEventData>): Promise<void> {
    const message = await this.decryptEventMessage(event);
    await selectPersistStateInit().pipe(take(1)).toPromise();

    if (!!message.publicKey && !!message.network) {
      const accountId = this.walletsService.generateWalletAccountId({
        publicKey: message.publicKey,
        network: message.network,
      });

      const account = this.walletsAccountsQuery.getEntity(accountId);

      if (!account) {
        this.connectService.rejectRequest(EventType.XBULL_SIGN_RESPONSE);
        return;
      }

      this.connectService.setSignTransaction({
        origin: event.origin,
        xdr: message.xdr,
        accountIdToUse: account._id,
        networkPassphraseToUse: message.network,
      });
    } else {
      this.connectService.setSignTransaction({
        origin: event.origin,
        xdr: message.xdr,
      });
    }
  }

  async decryptEventMessage(event: MessageEvent<IEventData>): Promise<any> {
    const pk = await this.openerPublicKey$.pipe(take(1)).toPromise();
    const keypair = await this.keypair$.pipe(take(1)).toPromise();

    if (!pk) {
      this.nzMessageService.error(`Data sent from the website is not valid`);
      return;
    }

    const decryptedJSON = box.open(
      decodeBase64(event.data.message),
      decodeBase64(event.data.oneTimeCode),
      decodeBase64(pk),
      decodeBase64(keypair.secretKey),
    );

    if (!decryptedJSON) {
      this.nzMessageService.error('Message sent from the website is invalid');
      return;
    }

    return JSON.parse(encodeUTF8(decryptedJSON));
  }

}
