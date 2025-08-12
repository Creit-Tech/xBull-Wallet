import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IConnectRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse, IRuntimeSignMessageResponse,
  IRuntimeSignXDRResponse, ISignMessageRequestPayload,
  ISignXDRRequestPayload,
  RuntimeMessage,
  XBULL_CONNECT_BACKGROUND,
  XBULL_SIGN_MESSAGE_BACKGROUND,
  XBULL_SIGN_XDR_BACKGROUND,
} from '../../../extension/interfaces';
import { SiteRequestComponent } from '~root/modules/background/components/site-request/site-request.component';
import { catchError, delay, filter, pluck, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { firstValueFrom, merge, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';
import {
  createSiteConnection,
  HorizonApisQuery,
  INetworkApi,
  IWalletsAccount,
  WalletsAccountsQuery
} from '~root/state';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import {
  ISigningResults,
  XdrSignerComponent
} from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';
import { selectPersistStateInit } from '@datorama/akita';
import { Networks } from '@stellar/stellar-sdk';
import {
  ISignMessageResult,
  SignMessageComponent
} from '~root/shared/shared-modals/components/sign-message/sign-message.component';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  connectedPort$: ReplaySubject<chrome.runtime.Port> = new ReplaySubject<chrome.runtime.Port>();
  runtimeEvent$: ReplaySubject<RuntimeMessage> = new ReplaySubject<RuntimeMessage>();

  constructor(
    private readonly sitesConnectionsService: SitesConnectionsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsService: WalletsService,
    private readonly horizonApisService: HorizonApisService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly translateService: TranslateService,
  ) { }

  connectHandler$ = this.runtimeEvent$.asObservable()
    .pipe(filter(message => message.event === XBULL_CONNECT_BACKGROUND))
    .pipe(pluck('payload'))
    .pipe(switchMap(payload => this.connectHandler(payload as IConnectRequestPayload)));


  signXDRHandler$ = this.runtimeEvent$.asObservable()
    .pipe(filter(message => message.event === XBULL_SIGN_XDR_BACKGROUND))
    .pipe(pluck('payload'))
    .pipe(switchMap(payload => this.signXDRHandler(payload as ISignXDRRequestPayload)));

  signMessageHandler$ = this.runtimeEvent$.asObservable()
    .pipe(filter(message => message.event === XBULL_SIGN_MESSAGE_BACKGROUND))
    .pipe(pluck('payload'))
    .pipe(switchMap(payload => this.signMessageHandler(payload as ISignMessageRequestPayload)));

  portResponseSubscription: Subscription = merge(
    this.connectHandler$,
    this.signXDRHandler$,
    this.signMessageHandler$
  )
    .pipe(catchError(error => {
      console.error(error);
      return of({
        error: true,
        errorMessage: 'Connection failed',
      });
    }))
    .pipe(delay(800))
    .pipe(withLatestFrom(this.connectedPort$))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([response, port]) => {
      port.postMessage(response);
      port.disconnect();
      window.close();
    });

  ngOnInit(): void {
    console.log('BackgroundComponent::ngOnInit!!')
    chrome.runtime.onConnect.addListener(port => {
      if (
        port.sender?.id !== chrome.runtime.id
        || [
          XBULL_CONNECT_BACKGROUND,
          XBULL_SIGN_XDR_BACKGROUND,
          XBULL_SIGN_MESSAGE_BACKGROUND
        ].indexOf(port.name) === -1
      ) {
        console.error('Connection rejected from the background component.')
        return;
      }

      this.connectedPort$.next(port);

      port.onMessage.addListener((message: RuntimeMessage) => {
        this.runtimeEvent$.next(message);
      });

      port.postMessage('ready');
    });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async connectHandler(params: IConnectRequestPayload): Promise<IRuntimeConnectResponse | IRuntimeErrorResponse> {
    await firstValueFrom(selectPersistStateInit());

    const resultSubject: Subject<IRuntimeConnectResponse | IRuntimeErrorResponse> =
      new Subject<IRuntimeConnectResponse | IRuntimeErrorResponse>();

    this.nzDrawerService.create<SiteRequestComponent>({
      nzTitle: this.translateService.instant('SITES_PERMISSIONS.SITE_CONNECTION'),
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzContent: SiteRequestComponent,
      nzClosable: false,
      nzData: {
        host: params.host,
        origin: params.origin,
        permissions: params.permissions,
        deny: () => {
          resultSubject.next({
            error: true,
            errorMessage: 'Connection denied'
          });
        },
        accept: () => {
          this.sitesConnectionsService.saveSiteConnection(createSiteConnection({
            _id: params.origin + '_' + params.host,
            host: params.host,
            origin: params.origin,
            canRequestSign: params.permissions.canRequestSign,
            canRequestPublicKey: params.permissions.canRequestPublicKey,
            createdAt: new Date().getTime(),
          }));
          resultSubject.next({
            error: false,
            payload: {
              canRequestPublicKey: params.permissions.canRequestPublicKey,
              canRequestSign: params.permissions.canRequestSign,
            },
          });
        }
      }
    });

    return firstValueFrom(resultSubject);

  }

  async signXDRHandler(params: ISignXDRRequestPayload): Promise<IRuntimeSignXDRResponse | IRuntimeErrorResponse> {
    await firstValueFrom(selectPersistStateInit());

    try {
      await this.checkAddressAndNetwork(params);
    } catch (e: any) {
      return e;
    }

    const resultSubject: Subject<IRuntimeSignXDRResponse | IRuntimeErrorResponse> =
      new Subject<IRuntimeSignXDRResponse | IRuntimeErrorResponse>();
    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: params.xdr,
        from: params.host,
        signingResultsHandler: async (data: ISigningResults): Promise<void> => {
          const selectedAccount: IWalletsAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$);
          resultSubject.next({
            error: false,
            payload: {
              signedXdr: data.signedXDR,
              signerAddress: selectedAccount.publicKey,
            },
          });
          drawerRef.close();
        },
      },
      nzTitle: 'Confirm and sign',
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
    });

    drawerRef.afterClose
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        resultSubject.next({
          error: true,
          errorMessage: 'Sign request denied'
        });
      });

    drawerRef.open();

    return firstValueFrom(resultSubject);
  }

  async signMessageHandler(params: ISignMessageRequestPayload): Promise<IRuntimeSignMessageResponse | IRuntimeErrorResponse> {
    console.log('BackgroundComponent::signMessageHandler')
    await firstValueFrom(selectPersistStateInit());

    try {
      await this.checkAddressAndNetwork(params);
    } catch (e: any) {
      return e;
    }

    const resultSubject: Subject<IRuntimeSignMessageResponse | IRuntimeErrorResponse> =
      new Subject<IRuntimeSignMessageResponse | IRuntimeErrorResponse>();
    const drawerRef = this.nzDrawerService.create<SignMessageComponent>({
      nzContent: SignMessageComponent,
      nzContentParams: {
        message: params.message,
        from: params.host,
        signingResultsHandler: async (data: ISignMessageResult): Promise<void> => {
          const selectedAccount: IWalletsAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$);
          resultSubject.next({
            error: false,
            payload: {
              signedMessage: data.signedMessage,
              signerAddress: selectedAccount.publicKey,
            },
          });
          drawerRef.close();
        },
      },
      nzTitle: 'Confirm and sign',
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
    });

    drawerRef.afterClose
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        resultSubject.next({
          error: true,
          errorMessage: 'Sign request denied'
        });
      });

    drawerRef.open();

    return firstValueFrom(resultSubject);
  }

  async checkAddressAndNetwork(params: { publicKey?: string; network?: Networks }): Promise<void> {
    if (!!params.network) {
      try {
        this.horizonApisService.setHorizonByNetwork(params.network);
      } catch (e: any) {
        return Promise.reject({
          error: true,
          errorMessage: e.name,
        });
      }
    }

    if (!!params.publicKey) {
      const selectedApi: INetworkApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);
      const accountId: string = this.walletsService.generateWalletAccountId({
        network: params.network || selectedApi.networkPassphrase,
        publicKey: params.publicKey,
      });

      const account = await this.walletsAccountsQuery.selectEntity(accountId).pipe(take(1)).toPromise();

      if (!!account) {
        this.walletsService.selectAccount({
          walletId: account.walletId,
          publicKey: account.publicKey,
        });
      } else {
        return Promise.reject({
          error: true,
          errorMessage: 'Combination of Network and public key is not available in this wallet',
        });
      }
    }
  }

}
