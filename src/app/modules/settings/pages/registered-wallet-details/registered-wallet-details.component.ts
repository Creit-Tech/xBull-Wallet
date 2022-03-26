import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, merge, Observable, pipe, Subject } from 'rxjs';
import { filter, map, pluck, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { IWallet, IWalletsAccount, WalletsAccountsQuery, WalletsQuery } from '~root/state';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { EditWalletNameComponent } from '~root/modules/settings/components/edit-wallet-name/edit-wallet-name.component';
import { HardConfirmComponent } from '~root/shared/modals/components/hard-confirm/hard-confirm.component';
import { withTransaction } from '@datorama/akita';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { AddAccountComponent } from '~root/modules/settings/components/add-account/add-account.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { DefaultFeeFormComponent } from '~root/modules/settings/components/default-fee-form/default-fee-form.component';

@Component({
  selector: 'app-registered-wallet-details',
  templateUrl: './registered-wallet-details.component.html',
  styleUrls: ['./registered-wallet-details.component.scss']
})
export class RegisteredWalletDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  removingWallet$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  walletId$ = this.route.params
    .pipe(pluck('walletId'));

  wallet$ = this.walletId$
    .pipe(switchMap(walletId => this.walletsQuery.selectEntity(walletId)));

  walletAccounts$: Observable<IWalletsAccount[]> = this.wallet$
    .pipe(filter<any>(wallet => !!wallet))
    .pipe(switchMap((wallet: IWallet) =>
      this.walletsAccountsQuery.selectAll({ filterBy: entity => entity.walletId === wallet._id })
    ));

  groupedWalletAccounts$: Observable<IWalletsAccount[]> = this.walletAccounts$
    .pipe(map(accounts =>
      accounts.reduce((all: { [publicKey: string]: IWalletsAccount }, current) => {
        return !all[current.publicKey]
          ? ({ ...all, [current.publicKey]: current })
          : all;
      }, {})
    ))
    .pipe(map(obj => Object.values(obj)));

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly walletsQuery: WalletsQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsService: WalletsService,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly nzDrawerService: NzDrawerService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onCreateAccount(): Promise<void> {
    const wallet = await this.wallet$.pipe(take(1)).toPromise();

    if (!wallet) {
      return ;
    }

    const drawerRef = this.nzDrawerService.create<AddAccountComponent>({
      nzContent: AddAccountComponent,
      nzWrapClassName: 'drawer-full-w-320',
      nzTitle: 'Add account',
      nzContentParams: {
        parentWallet: wallet
      }
    });

    drawerRef.open();
  }

  async onEditName(): Promise<void> {
    const wallet = await this.wallet$.pipe(take(1)).toPromise();

    if (!wallet) {
      // TODO: add error here later
      return;
    }
    const drawerRef = this.nzDrawerService.create<EditWalletNameComponent>({
      nzContent: EditWalletNameComponent,
      nzTitle: `Edit wallet name`,
      nzWrapClassName: 'drawer-full-w-320',
      nzContentParams: {
        wallet
      }
    });

    drawerRef.open();
  }

  async onRemove(): Promise<void> {
    const wallet = await this.wallet$.pipe(take(1)).toPromise();

    if (!wallet) {
      // TODO: add error message later
      return;
    }

    const walletsAccounts = await this.walletsAccountsQuery.selectAll({
      filterBy: state => state.walletId === wallet._id
    }).pipe(take(1)).toPromise();

    const drawerRef = this.nzDrawerService.create<HardConfirmComponent>({
      nzContent: HardConfirmComponent,
      nzTitle: `Remove wallet ${wallet.name}`,
      nzWrapClassName: 'drawer-full-w-320',
      nzContentParams: {
        title: 'Remove Wallet',
        alertMessage: `You're going to remove this wallet from this extension, your assets are safe in the blockchain but make sure you have a way to recover your private keys. Once it's removed we can't get it back until you create it again with your recover method`
      }
    });

    drawerRef.open();

    await drawerRef.afterOpen.pipe(take(1)).toPromise();

    const componentRef = drawerRef.getContentComponent();

    if (!componentRef) {
      return;
    }

    componentRef.confirmed
      .asObservable()
      .pipe(take(1))
      .pipe(tap(() => this.removingWallet$.next(true)))
      .pipe(withTransaction(() => {
        this.walletsService.removeWallets([wallet._id]);
        this.walletsAccountsService.removeAccounts(walletsAccounts.map(account => account._id));
      }))
      .pipe(takeUntil(
        merge(this.componentDestroyed$, drawerRef.afterClose)
      ))
      .subscribe(() => {
        this.router.navigate(['/settings/wallets'])
          .then();
      });
  }

}
