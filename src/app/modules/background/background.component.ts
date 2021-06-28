import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import {
  IConnectRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse, IRuntimeSignXDRResponse, ISignXDRRequestPayload,
  RuntimeMessage,
  RuntimeResponse,
  XBULL_CONNECT_BACKGROUND,
  XBULL_SIGN_XDR_BACKGROUND,
} from '../../../extension/interfaces';
import { SiteRequestComponent } from '~root/modules/background/components/site-request/site-request.component';
import { take, takeUntil } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SignXdrComponent } from '~root/shared/modals/components/sign-xdr/sign-xdr.component';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  constructor(
    private readonly modalsService: ModalsService,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly sitesConnectionsService: SitesConnectionsService,
    private readonly cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    chrome
      .runtime
      .onMessage
      .addListener((message: RuntimeMessage, sender, sendResponse) => {
        console.log(message);
        let runtimeResponse: RuntimeResponse;
        switch (message.event) {
          case XBULL_CONNECT_BACKGROUND:
            this.connectHandler(message.payload)
              .then((response) => {
                runtimeResponse = response;
                sendResponse(runtimeResponse);
              })
              .catch(e => {
                console.error(e);
                runtimeResponse = {
                  error: true,
                  errorMessage: 'Connection failed',
                };
                sendResponse(runtimeResponse);
              });
            break;

          case XBULL_SIGN_XDR_BACKGROUND:
            this.signXDRHandler(message.payload)
              .then(sendResponse)
              .catch(e => {
                console.error(e);
                runtimeResponse = {
                  error: true,
                  errorMessage: 'Connection failed',
                };
                sendResponse(runtimeResponse);
              });
            break;

          default:
            runtimeResponse = {
              error: true,
              errorMessage: 'Message event from background not supported',
            };
            sendResponse(runtimeResponse);
            break;
        }

        return true;
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
          ref.close();
        });

      ref.component.instance.accept
        .asObservable()
        .pipe(take(1))
        .pipe(takeUntil(this.componentDestroyed$))
        .subscribe(() => {
          this.sitesConnectionsService.saveSiteConnection({
            _id: params.origin + '_' + params.host,
            canRequestSign: params.permissions.canRequestSign,
            canRequestPublicKey: params.permissions.canRequestPublicKey,
            createdAt: new Date().getTime(),
          });

          resolve({
            error: false,
            payload: {
              canRequestPublicKey: params.permissions.canRequestPublicKey,
              canRequestSign: params.permissions.canRequestSign,
            },
          });
          ref.close();
        });
    });
  }

  async signXDRHandler(params: ISignXDRRequestPayload): Promise<IRuntimeSignXDRResponse | IRuntimeErrorResponse> {
    const ref = await this.componentCreatorService.createOnBody<SignXdrComponent>(SignXdrComponent);

    ref.component.instance.xdr = params.xdr;
    ref.component.instance.from = params.host;

    ref.open();

    return new Promise(resolve => {
      merge(ref.component.instance.deny.asObservable(), ref.destroyed$.asObservable())
        .pipe(take(1))
        .pipe(takeUntil(this.componentDestroyed$))
        .subscribe(() => {
          resolve({
            error: true,
            errorMessage: 'Sign request denied'
          });
          ref.close();
        });

      ref.component.instance.accept
        .pipe(take(1))
        .pipe(takeUntil(merge(this.componentDestroyed$, ref.destroyed$.asObservable())))
        .subscribe(signedXDR => {
          resolve({
            error: false,
            payload: signedXDR
          });
          ref.close();
        });
    });
  }

}
