import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IConnectRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse,
  IRuntimeSignXDRResponse,
  ISignXDRRequestPayload,
  RuntimeMessage,
  XBULL_CONNECT_BACKGROUND,
  XBULL_SIGN_XDR_BACKGROUND,
} from '../../../extension/interfaces';
import { SiteRequestComponent } from '~root/modules/background/components/site-request/site-request.component';
import { catchError, delay, filter, pluck, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { firstValueFrom, merge, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import {
  createSiteConnection,
  HorizonApisQuery,
  IHorizonApi,
  IWalletsAccount,
  WalletsAccountsQuery
} from '~root/state';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import {HorizonApisService} from '~root/core/services/horizon-apis.service';
import {
  ISigningResults,
  XdrSignerComponent
} from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';

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

  portResponseSubscription: Subscription = merge(
    this.connectHandler$,
    this.signXDRHandler$
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
    chrome.runtime.onConnect.addListener(port => {
      if (
        port.sender?.id !== chrome.runtime.id
        || [
          XBULL_CONNECT_BACKGROUND,
          XBULL_SIGN_XDR_BACKGROUND
        ].indexOf(port.name) === -1
      ) {
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
    if (!!params.network) {
      try {
        this.horizonApisService.setHorizonByNetwork(params.network);
      } catch (e: any) {
        return {
          error: true,
          errorMessage: e.name,
        };
      }
    }

    if (!!params.publicKey) {
      const selectedApi: IHorizonApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);
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
        return {
          error: true,
          errorMessage: 'Combination of Network and public key is not available in this wallet',
        };
      }
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

}
