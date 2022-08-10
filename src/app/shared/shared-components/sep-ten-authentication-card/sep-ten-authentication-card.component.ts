import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WalletsAccountsQuery } from '~root/state';
import { BehaviorSubject } from 'rxjs';
import { Sep10Service } from '~root/core/services/sep10/sep-10.service';
import { take } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-sep-ten-authentication-card',
  templateUrl: './sep-ten-authentication-card.component.html',
  styleUrls: ['./sep-ten-authentication-card.component.scss']
})
export class SepTenAuthenticationCardComponent implements OnInit {
  @Input() title = 'Authenticate with account';
  @Input() sep10Url!: string;
  @Output() token = new EventEmitter<string>();

  authenticating$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly sep10Service: Sep10Service,
  ) { }

  ngOnInit(): void {
  }

  emitToken(token: string): void {
    this.token.emit(token);
  }

  async onConfirm(): Promise<void> {
    const selectedAccount = await this.selectedAccount$
      .pipe(take(1))
      .toPromise();

    if (!selectedAccount) {
      return;
    }

    try {
      this.authenticating$.next(true);
      const token = await this.sep10Service.authenticateWithServer(this.sep10Url, {
        account: selectedAccount.publicKey,
      });

      this.emitToken(token);
      this.authenticating$.next(false);
    } catch (e: any) {
      this.nzMessageService.error(e?.error?.message || e?.message || 'Unexpected error when authenticating');
      this.authenticating$.next(false);
    }
  }

}
