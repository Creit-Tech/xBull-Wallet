import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import {
  IConnectRequestPayload,
  IRuntimeConnectMessage, IRuntimeConnectResponse, IRuntimeErrorResponse,
  RuntimeMessage,
  RuntimeResponse,
  XBULL_CONNECT_BACKGROUND,
} from '../../../extension/interfaces';
import { SiteRequestComponent } from '~root/modules/background/components/site-request/site-request.component';
import { take, takeUntil } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  constructor(
    private readonly modalsService: ModalsService,
    private readonly sitesConnectionsService: SitesConnectionsService,
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
    const modalData = await this.modalsService.open<SiteRequestComponent>({
      component: SiteRequestComponent,
      componentInputs: [{
        value: params.host, input: 'host'
      }, {
        value: params.origin, input: 'origin'
      }, {
        value: params.permissions, input: 'permissions'
      }]
    });

    await new Promise(r => setTimeout(r, 500));

    return new Promise(resolve => {
      modalData.modalContainer.instance.closeModal$
        .asObservable()
        .pipe(take(1))
        .pipe(takeUntil(this.componentDestroyed$))
        .subscribe(() => {
          resolve({
            error: true,
            errorMessage: 'Request denied',
          });
          modalData.modalContainer.instance.onClose();
        });

      modalData.componentRef.instance.accept
        .asObservable()
        .pipe(take(1))
        .pipe(takeUntil(merge(
          modalData.modalContainer.instance.closeModal$,
          this.componentDestroyed$
        )))
        .subscribe(() => {
          const siteConnection = {
            _id: `${params.origin}_${params.host}`,
            createdAt: new Date().getTime(),
            canRequestPublicKey: params.permissions.canRequestPublicKey,
            canRequestSign: params.permissions.canRequestSign,
          };

          this.sitesConnectionsService.saveSiteConnection(siteConnection);
          resolve({
            error: false,
            payload: {
              canRequestPublicKey: siteConnection.canRequestPublicKey,
              canRequestSign: siteConnection.canRequestSign,
            },
          });
          modalData.modalContainer.instance.onClose();
        });
    });
  }

}
