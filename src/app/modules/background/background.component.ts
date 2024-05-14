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
import { createSiteConnection, WalletsAccountsQuery } from '~root/state';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import {HorizonApisService} from '~root/core/services/horizon-apis.service';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';

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
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly sitesConnectionsService: SitesConnectionsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsService: WalletsService,
    private readonly horizonApisService: HorizonApisService,
    private readonly nzDrawerService: NzDrawerService,
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
    const ref = await this.componentCreatorService.createOnBody<SiteRequestComponent>(SiteRequestComponent);
    ref.component.instance.host = params.host;
    ref.component.instance.origin = params.origin;
    ref.component.instance.permissions = params.permissions;

    ref.open();

    return new Promise(resolve => {
      ref.component.instance.deny
        .asObservable()
        .pipe(take(1))
        .pipe(takeUntil(this.componentDestroyed$))
        .subscribe(() => {
          resolve({
            error: true,
            errorMessage: 'Connection denied'
          });
          ref.component.instance.onClose()
            .then(() => ref.close());
        });

      ref.component.instance.accept
        .asObservable()
        .pipe(take(1))
        .pipe(takeUntil(this.componentDestroyed$))
        .subscribe(() => {
          this.sitesConnectionsService.saveSiteConnection(createSiteConnection({
            _id: params.origin + '_' + params.host,
            host: params.host,
            origin: params.origin,
            canRequestSign: params.permissions.canRequestSign,
            canRequestPublicKey: params.permissions.canRequestPublicKey,
            createdAt: new Date().getTime(),
          }));

          resolve({
            error: false,
            payload: {
              canRequestPublicKey: params.permissions.canRequestPublicKey,
              canRequestSign: params.permissions.canRequestSign,
            },
          });
          ref.component.instance.onClose()
            .then(() => ref.close());
        });
    });
  }

  async signXDRHandler(params: ISignXDRRequestPayload): Promise<IRuntimeSignXDRResponse | IRuntimeErrorResponse> {
    if (!!params.network && !!params.publicKey) {
      try {
        this.horizonApisService.setHorizonByNetwork(params.network);
      } catch (e: any) {
        return {
          error: true,
          errorMessage: e.name,
        };
      }

      const accountId = this.walletsService.generateWalletAccountId({
        network: params.network,
        publicKey: params.publicKey,
      });

      const account = await this.walletsAccountsQuery.selectEntity(accountId).pipe(take(1)).toPromise();

      if (!!account) {
        await this.walletsService.selectAccount({
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
        signingResultsHandler: data => {
          resultSubject.next({
            error: false,
            payload: data.signedXDR,
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
