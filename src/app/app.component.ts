import { AfterViewInit, Component } from '@angular/core';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { WalletsAccountsQuery } from '~root/core/wallets/state';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { selectPersistStateInit } from '@datorama/akita';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'xBull - Wallet';

  constructor(
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  createWalletsAccountsQuery: Subscription = selectPersistStateInit()
    .pipe(switchMap(() => this.walletsAccountsQuery.getSelectedAccount$))
    .pipe(filter(account => !!account))
    .pipe(debounceTime(100))
    .subscribe(account => {
      this.walletsAccountsService.createStream(account);
    });

  ngAfterViewInit(): void {
    chrome
      .runtime
      .sendMessage({ command: 'fetch' }, response => {
        console.log({response});
      });
  }


}
