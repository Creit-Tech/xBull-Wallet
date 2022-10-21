import { Component, Input, OnInit } from '@angular/core';
import { SessionTypes } from '@walletconnect/types';
import { ReplaySubject } from 'rxjs';
import { WalletConnectService } from '~root/modules/walletconnect/services/walletconnect.service';
import { take } from 'rxjs/operators';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IWalletConnectSessionModel } from '~root/state/walletconnect-sessions/walletconnect-session.model';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.scss']
})
export class SessionDetailsComponent implements OnInit {
  session$: ReplaySubject<IWalletConnectSessionModel> = new ReplaySubject<IWalletConnectSessionModel>();
  @Input() set session(data: IWalletConnectSessionModel) {
    this.session$.next(data);
  }

  loading = false;

  constructor(
    private readonly walletConnectService: WalletConnectService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalService: NzModalService,
  ) { }

  ngOnInit(): void {
  }

  methodAvailable(methods: string[]): string {
    if (methods.includes('stellar_signAndSubmitXDR')) {
      return 'Sign and submit';
    }

    if (methods.includes('stellar_signXDR')) {
      return 'Sign and return';
    }

    return 'No method requested by the app';
  }

  async deleteSession(): Promise<void> {
    this.loading = true;
    const session = await this.session$.pipe(take(1)).toPromise();
    try {
      await this.walletConnectService.disconnectSession({
        topic: session.topic,
        reason: 'User deleted the session',
      });

      this.loading = false;
      this.nzDrawerRef.close();
    } catch (e) {
      this.loading = false;
      this.nzModalService.confirm({
        nzContent: 'We were not able to disconnect the session. Do you want to remove it from this wallet only instead?',
        nzOnOk: instance => {
          this.walletConnectService.removeSession(session.topic);
          this.nzDrawerRef.close();
        }
      });
    }
  }

}
