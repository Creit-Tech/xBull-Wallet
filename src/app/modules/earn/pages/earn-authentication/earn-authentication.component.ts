import { Component, Inject, OnInit } from '@angular/core';
import { ENV, environment } from '~env';
import { Router } from '@angular/router';
import { EarnTokensService } from '~root/modules/earn/state/tokens/earn-tokens.service';
import { WalletsAccountsQuery } from '~root/state';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-earn-authentication',
  templateUrl: './earn-authentication.component.html',
  styleUrls: ['./earn-authentication.component.scss']
})
export class EarnAuthenticationComponent implements OnInit {
  authenticationUrl = this.env.xPointersApi + '/sep10';
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly router: Router,
    private readonly earnTokensService: EarnTokensService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  ngOnInit(): void {
  }

  onAuthenticated(token: string): void {
    this.selectedAccount$
      .pipe(take(1))
      .subscribe(selectedAccount => {
        if (!selectedAccount) {
          return;
        }

        this.earnTokensService.saveAuthenticationToken({
          walletAccountId: selectedAccount._id,
          publicKey: selectedAccount.publicKey,
          token,
        });
        this.router.navigate(['/earn'])
          .then();
      });
  }

}

