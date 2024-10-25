import { Injectable, NgZone } from '@angular/core';
import { InAppBrowser, InAppBrowserObject } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { InAppBrowserEvent } from '@awesome-cordova-plugins/in-app-browser';
import { firstValueFrom, Subject, take, takeUntil } from 'rxjs';
import { Networks } from '@stellar/stellar-sdk';
import {
  createSiteConnection, HorizonApisQuery, INetworkApi,
  ISiteConnection,
  IWalletsAccount,
  SitesConnectionsQuery,
  WalletsAccountsQuery
} from '~root/state';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { SiteRequestComponent } from '~root/modules/background/components/site-request/site-request.component';
import { TranslateService } from '@ngx-translate/core';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import {
  ISigningResults,
  XdrSignerComponent
} from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import {
  EventTypes,
  IConnectRequestPayload, IGetNetworkRequestPayload,
  IGetPublicKeyRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse, IRuntimeGetNetworkResponse,
  IRuntimeGetPublicKeyResponse,
  IRuntimeSignXDRResponse,
  ISignXDRRequestPayload,
  XBULL_CONNECT, XBULL_GET_NETWORK,
  XBULL_GET_PUBLIC_KEY,
  XBULL_SIGN_XDR
} from '~extension/interfaces';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root',
})
export class BrowserService {

  private browser: InAppBrowserObject | null = null;
  private readonly exitEvent: Subject<void> = new Subject<void>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly sitesConnectionsQuery: SitesConnectionsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
    private readonly sitesConnectionsService: SitesConnectionsService,
    private readonly horizonApisService: HorizonApisService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsService: WalletsService,
    private readonly iab: InAppBrowser,
    private readonly nzMessageService: NzMessageService,
    // private readonly translate: TranslateService
  ) {}

  private setListeners() {
    if (!this.browser) {
      const message = `Browser instance is not loaded`;
      this.nzMessageService.error(message, { nzDuration: 5000 });
      throw new Error(message);
    }

    this.browser
      .on('message')
      .pipe(takeUntil(this.exitEvent.asObservable()))
      .subscribe((e: InAppBrowserEvent) => {
        this.ngZone.run(() => {
          this.handleWebMessage(e)
            .then()
            .catch((err: unknown) => {
              // TODO: Toast this
              console.error(err);
            });
        });
      });

    this.browser
      .on('loaderror')
      .pipe(take(1))
      .pipe(takeUntil(this.exitEvent.asObservable()))
      .subscribe(e => {
        console.error('loaderror', e);
        this.browser = null;
        this.exitEvent.next();
      });

    this.browser
      .on('loadstop')
      .pipe(take(1))
      .pipe(takeUntil(this.exitEvent.asObservable()))
      .subscribe({
        next: value => {
          // console.log('loadstop', value);
        },
        error: err => {
          // TODO: add toast message
          console.error('loadstop', err);
          this.browser = null;
          this.exitEvent.next();
        },
      });

    this.browser
      .on('exit')
      .pipe(take(1))
      .pipe(takeUntil(this.exitEvent.asObservable()))
      .subscribe({
        next: value => {
          // console.log('exit', value);
          this.browser = null;
          this.exitEvent.next();
        },
        error: err => {
          // TODO: add toast message
          console.error('exit', err);
          this.browser = null;
          this.exitEvent.next();
        },
      });
  }

  async open(url: string): Promise<void> {
    this.browser = this.iab.create(
      encodeURI(url),
      '_blank',
      {
        footer: 'no',
        usewkwebview: 'yes',
        enableViewportScale: 'no',
        hideurlbar: 'no',
        zoom: 'no',
        hardwareback: 'no',
        transitionstyle: 'fliphorizontal',
        toolbarposition: 'bottom',
      }
    );
    this.setListeners();
  }

  private async handleWebMessage(e: InAppBrowserEvent): Promise<void> {
    let payload: IConnectRequestPayload | IGetPublicKeyRequestPayload | ISignXDRRequestPayload | IGetNetworkRequestPayload;
    let activeAccount: IWalletsAccount | undefined;
    let drawerRef: NzDrawerRef;
    switch (e.data.type as EventTypes) {
      case XBULL_CONNECT:
        payload = e.data.detail as IConnectRequestPayload;

        const connection: ISiteConnection | undefined = this.sitesConnectionsQuery.getEntity(payload.origin + '_' + payload.host);

        if (!!connection?.canRequestPublicKey) {
          const activeAccount: IWalletsAccount | undefined = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$)
          await this.assertActiveKeyPair(e.data.eventId, activeAccount);
          this.answerWebMessage({
            eventId: e.data.eventId,
            response: { error: false, payload: (payload as IConnectRequestPayload).permissions },
          });
        } else {
          drawerRef = this.nzDrawerService.create<SiteRequestComponent>({
            nzTitle: this.translateService.instant('SITES_PERMISSIONS.SITE_CONNECTION'),
            nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
            nzContent: SiteRequestComponent,
            nzClosable: false,
            nzData: {
              host: (payload as IConnectRequestPayload).host,
              origin: (payload as IConnectRequestPayload).origin,
              permissions: (payload as IConnectRequestPayload).permissions,
              deny: () => {
                this.answerWebMessage({
                  eventId: e.data.eventId,
                  response: { error: true, errorMessage: 'Connection denied' },
                });

                drawerRef.close();
              },
              accept: () => {
                this.sitesConnectionsService.saveSiteConnection(createSiteConnection({
                  _id: payload.origin + '_' + payload.host,
                  host: payload.host,
                  origin: payload.origin,
                  canRequestSign: (payload as IConnectRequestPayload).permissions.canRequestSign,
                  canRequestPublicKey: (payload as IConnectRequestPayload).permissions.canRequestPublicKey,
                  createdAt: new Date().getTime(),
                }));

                this.answerWebMessage({
                  eventId: e.data.eventId,
                  response: { error: false, payload: (payload as IConnectRequestPayload).permissions }
                });

                drawerRef.close();
              }
            },
          });

          this.browser?.hide();
        }

        break;

      case XBULL_GET_PUBLIC_KEY:
        payload = e.data.detail as IGetPublicKeyRequestPayload;

        await this.assertCanRequestPublicKey(e.data.eventId, payload.origin + '_' + payload.host);

        activeAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$)
        await this.assertActiveKeyPair(e.data.eventId, activeAccount);

        this.answerWebMessage({
          eventId: e.data.eventId,
          response: { error: false, payload: activeAccount.publicKey },
        });

        break;

      case XBULL_SIGN_XDR:
        payload = e.data.detail;
        const { network, publicKey, xdr } = payload as ISignXDRRequestPayload;

        await this.assertCanRequestPublicKey(e.data.eventId, payload.origin + '_' + payload.host);

        if (!!network) {
          try {
            this.horizonApisService.setHorizonByNetwork(network);
          } catch (e: any) {
            this.answerWebMessage({
              eventId: e.data.eventId,
              response: { error: true, errorMessage: e.message }
            });
          }
        }

        if (publicKey) {
          const selectedApi: INetworkApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);
          const accountId: string = this.walletsService.generateWalletAccountId({
            network: network || selectedApi.networkPassphrase,
            publicKey: publicKey,
          });

          const account: IWalletsAccount | undefined = await firstValueFrom(this.walletsAccountsQuery.selectEntity(accountId));

          if (!!account) {
            this.walletsService.selectAccount({
              walletId: account.walletId,
              publicKey: account.publicKey,
            });
          } else {
            this.answerWebMessage({
              eventId: e.data.eventId,
              response: { error: true, errorMessage: 'Combination of Network and public key is not available in this wallet' }
            });
          }
        }

        activeAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$)
        await this.assertActiveKeyPair(e.data.eventId, activeAccount);

        drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
          nzContent: XdrSignerComponent,
          nzData: {
            xdr,
            from: payload.host,

            signingResultsHandler: async (data: ISigningResults): Promise<void> => {
              const selectedAccount: IWalletsAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$);
              this.answerWebMessage({
                eventId: e.data.eventId,
                response: {
                  error: false,
                  payload: {
                    signedXdr: data.signedXDR,
                    signerAddress: selectedAccount.publicKey,
                  },
                }
              });

              drawerRef.close(true);
            },
          },
          nzClosable: false,
          nzTitle: 'Confirm and sign',
          nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
        });

        drawerRef.afterClose
          .subscribe((success: boolean) => {
            if (!success) {
              this.answerWebMessage({
                eventId: e.data.eventId,
                response: { error: true, errorMessage: 'Sign request denied' }
              });
            }
          });

        drawerRef.open();

        this.browser?.hide();
        break;

      case XBULL_GET_NETWORK:
        payload = e.data.detail as IGetNetworkRequestPayload;

        const activeHorizonApi: INetworkApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);

        const index: number = Object.values(Networks)
          .findIndex((n: Networks): boolean => n === activeHorizonApi.networkPassphrase);

        this.answerWebMessage({
          eventId: e.data.eventId,
          response: {
            error: false,
            payload: {
              network: Object.keys(Networks)[index],
              networkPassphrase: activeHorizonApi.networkPassphrase
            }
          },
        });

        break;

      default:
        throw new Error();
    }
  }

  private answerWebMessage(params: {
    response: IRuntimeConnectResponse | IRuntimeGetPublicKeyResponse | IRuntimeSignXDRResponse | IRuntimeErrorResponse | IRuntimeGetNetworkResponse;
    eventId: string;
  }): void {
    if (!this.browser) {
      const message = `Browser instance is not loaded`;
      this.nzMessageService.error(message, { nzDuration: 5000 });
      throw new Error(message);
    }

    const message = JSON.stringify({ eventId: params.eventId, detail: params.response });
    // console.log('Answer:', message);
    this.browser.show();
    this.browser.executeScript({ code: `window.postMessage(JSON.parse('${message}'))` }).then();
  }

  private async assertCanRequestPublicKey(eventId: string, siteId: string) {
    const connection: ISiteConnection | undefined = this.sitesConnectionsQuery.getEntity(siteId);
    if (connection?.canRequestPublicKey) {
      return;
    } else {
      this.answerWebMessage({
        eventId,
        response: {
          error: true,
          errorMessage: 'You are not authorized to request a public key from this wallet',
        },
      });

      throw new Error('You are not authorized to request a public key from this wallet');
    }
  }

  private async assertActiveKeyPair(eventId: string, activeKeyPair: IWalletsAccount | undefined) {
    if (activeKeyPair) {
      return;
    } else {
      this.answerWebMessage({
        eventId: eventId,
        response: {
          error: true,
          errorMessage: 'There are no active account',
        },
      });

      throw new Error('There are no active account');
    }
  }
}
