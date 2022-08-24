import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import SignClient from '@walletconnect/sign-client';
import { FormControl } from '@angular/forms';
import { WalletConnectService } from '~root/modules/walletconnect/services/walletconnect.service';
import { WalletConnectSessionsQuery } from '~root/state/walletconnect-sessions/walletconnect-sessions.query';
import { distinctUntilArrayItemChanged } from '@datorama/akita';
import { SessionTypes } from '@walletconnect/types';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  SessionDetailsComponent
} from '~root/modules/walletconnect/components/session-details/session-details.component';
import { from } from 'rxjs';
import QrScanner from 'qr-scanner';
import { QrScanModalComponent } from '~root/shared/modals/components/qr-scan-modal/qr-scan-modal.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IWalletConnectSessionModel } from '~root/state/walletconnect-sessions/walletconnect-session.model';

@Component({
  selector: 'app-walletconnect-dashboard',
  templateUrl: './walletconnect-dashboard.component.html',
  styleUrls: ['./walletconnect-dashboard.component.scss']
})
export class WalletConnectDashboardComponent implements OnInit {
  hasCamera = from(QrScanner.hasCamera());

  newSessionModalRef?: NzModalRef;
  @ViewChild('newSessionModal') newSessionModal!: TemplateRef<any>;
  uriOptionsRef?: NzModalRef;
  @ViewChild('uriOption') uriOption!: TemplateRef<any>;

  uriControl: FormControl<string | null> = new FormControl<string | null>('');

  sessions$ = this.walletConnectSessionsQuery.selectAll()
    .pipe(distinctUntilArrayItemChanged());

  constructor(
    private readonly nzModalService: NzModalService,
    private readonly walletConnectService: WalletConnectService,
    private readonly walletConnectSessionsQuery: WalletConnectSessionsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
  }

  showSessionDetails(session: IWalletConnectSessionModel): void {
    this.nzDrawerService.create<SessionDetailsComponent>({
      nzContent: SessionDetailsComponent,
      nzTitle: '',
      nzContentParams: { session },
      nzPlacement: 'bottom',
      nzHeight: 'auto',
      nzWrapClassName: 'ios-safe-y',
    });
  }

  addNewSession(): void {
    this.newSessionModalRef = this.nzModalService.create({
      nzContent: this.newSessionModal,
      nzTitle: 'Pick an option',
      nzWidth: '300px',
      nzFooter: null,
      nzCentered: true,
    });
  }

  onQrScan(): void {
    this.newSessionModalRef?.close();
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: 'Scan QR',
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: async text => {
          await this.walletConnectService.pairWithClient(text);
          drawerRef.close();
        }
      }
    });

    drawerRef.open();
  }

  onUriOption(): void {
    this.newSessionModalRef?.close();
    this.uriOptionsRef = this.nzModalService.create({
      nzContent: this.uriOption,
      nzTitle: 'Paste connection URI',
      nzWidth: '300px',
      nzFooter: null,
      nzCentered: true
    });
  }

  async connectURI(): Promise<void> {
    if (!this.uriControl.value) {
      return;
    }

    try {
      await this.walletConnectService.pairWithClient(this.uriControl.value);
      this.uriControl.reset();
      this.uriOptionsRef?.close();
    } catch (e) {}
  }

}
