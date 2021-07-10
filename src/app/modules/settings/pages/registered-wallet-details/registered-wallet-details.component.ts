import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, pluck, switchMap, take, takeUntil } from 'rxjs/operators';
import { WalletsAccountsQuery, WalletsQuery } from '~root/state';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { EditWalletNameComponent } from '~root/modules/settings/components/edit-wallet-name/edit-wallet-name.component';
import { merge, Subject } from 'rxjs';

@Component({
  selector: 'app-registered-wallet-details',
  templateUrl: './registered-wallet-details.component.html',
  styleUrls: ['./registered-wallet-details.component.scss']
})
export class RegisteredWalletDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  walletId$ = this.route.params
    .pipe(pluck('walletId'))
    .pipe(map((walletId: string) => parseInt(walletId, 10)));

  wallet$ = this.walletId$
    .pipe(switchMap(walletId => this.walletsQuery.selectEntity(walletId)));

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly walletsQuery: WalletsQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onEditName(): Promise<void> {
    const [
      ref,
      wallet
    ] = await Promise.all([
      this.componentCreatorService.createOnBody<EditWalletNameComponent>(EditWalletNameComponent),
      this.wallet$.pipe(take(1)).toPromise()
    ]);

    if (!wallet) {
      // TODO: add error here later
      return;
    }

    ref.component.instance.wallet = wallet;

    ref.component.instance.close
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

}
