import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WalletConnectService } from '~root/modules/walletconnect/services/walletconnect.service';
import { HorizonApisQuery, WalletsAccountsQuery } from '~root/state';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { take } from 'rxjs/operators';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';

@Component({
  selector: 'app-session-request',
  templateUrl: './session-request.component.html',
  styleUrls: ['./session-request.component.scss']
})
export class SessionRequestComponent implements OnInit, OnDestroy {
  @Input() eventId!: number;
  @Input() topic!: string;
  @Input() xdr!: string;
  @Input() method!: 'stellar_signAndSubmitXDR' | 'stellar_signXDR';

  @Input() name?: string;
  @Input() url?: string;
  @Input() img?: string;


  accepted = false;
  loading = false;

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;
  selectedHorizonApi$ = this.horizonApisQuery.getSelectedHorizonApi$;

  constructor(
    private readonly walletConnectService: WalletConnectService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (!this.eventId || this.accepted || !this.topic) {
      return;
    }

    this.walletConnectService.rejectRequest({
      topic: this.topic,
      id: this.eventId,
    })
      .then();
  }

  async onAccept(): Promise<void> {
    const [
      selectedAccount,
      selectedHorizonApi
    ] = await Promise.all([
      this.selectedAccount$.pipe(take(1)).toPromise(),
      this.selectedHorizonApi$.pipe(take(1)).toPromise(),
    ]);

    if (
      !selectedAccount ||
      !selectedHorizonApi ||
      !this.xdr ||
      !this.eventId ||
      !this.topic
    ) {
      return;
    }

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzCloseOnNavigation: true,
      nzTitle: 'Confirm request',
      nzContentParams: {
        xdr: this.xdr,
        signingResultsHandler: async data => {
          this.loading = true;
          this.accepted = true;

          if (this.method === 'stellar_signXDR') {
            await this.walletConnectService.requestResponse({
              xdr: data.signedXDR,
              success: true,
              topic: this.topic,
              id: this.eventId,
            });
          } else {
            try {
              await this.stellarSdkService.Server.submitTransaction(data.transaction);
              await this.walletConnectService.requestResponse({
                success: true,
                topic: this.topic,
                id: this.eventId,
              });
            } catch (e) {
              await this.walletConnectService.requestResponse({
                errorMessage: 'Submission rejected by the network',
                success: false,
                topic: this.topic,
                id: this.eventId,
              });
            }
          }

          this.loading = false;
          this.nzDrawerRef.close();
        }
      }
    });
  }

  async onReject(): Promise<void> {
    this.nzDrawerRef.close();
  }

}
