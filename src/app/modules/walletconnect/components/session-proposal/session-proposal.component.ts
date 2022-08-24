import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WalletConnectService } from '~root/modules/walletconnect/services/walletconnect.service';
import { HorizonApisQuery, WalletsAccountsQuery } from '~root/state';
import { ProposalTypes } from '@walletconnect/types';
import { take } from 'rxjs/operators';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { Subject } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-session-proposal',
  templateUrl: './session-proposal.component.html',
  styleUrls: ['./session-proposal.component.scss']
})
export class SessionProposalComponent implements OnInit, OnDestroy {
  @Input() name?: string;
  @Input() description?: string;
  @Input() url?: string;
  @Input() img?: string;
  @Input() proposal?: ProposalTypes.Struct;

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
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (!this.proposal || this.accepted) {
      return;
    }

    this.walletConnectService.rejectProposal(this.proposal.id)
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
      !this.proposal
    ) {
      return;
    }

    this.loading = true;

    try {
      await this.walletConnectService.approvePairing({
        proposal: this.proposal,
        accountsPublicKeys: [selectedAccount.publicKey],
        network: selectedHorizonApi.networkPassphrase
      });
    } catch (e) {
      console.error(e);
      this.loading = false;
      this.nzMessageService.error('There was an error when talking with the WalletConnect protocol');
      return;
    }

    this.accepted = true;
    this.loading = false;
    this.nzDrawerRef.close();
  }

  async onReject(): Promise<void> {
    this.nzDrawerRef.close();
  }

}
