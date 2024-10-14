import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  HorizonApisQuery,
  INetworkApi,
  IWalletsAccount,
  SettingsQuery,
  WalletsAccountsQuery,
  WalletsQuery
} from '~root/state';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable, Subject, Subscription } from 'rxjs';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { UntypedFormControl, Validators } from '@angular/forms';
import { map, pluck, startWith, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-layout-v1-account-horizon-selector',
  templateUrl: './layout-v1-account-horizon-selector.component.html',
  styleUrls: ['./layout-v1-account-horizon-selector.component.scss']
})
export class LayoutV1AccountHorizonSelectorComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  wallets$ = this.walletsQuery.selectAll();
  selectedWallet$ = this.walletsQuery.getSelectedWallet$;

  horizonApis: Observable<INetworkApi[]> = this.horizonApisQuery.selectAll();
  selectedHorizonApi$: Observable<INetworkApi> = this.horizonApisQuery.getSelectedHorizonApi$;
  selectedWalletAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  horizonSelectControl: UntypedFormControl = new UntypedFormControl('', [Validators.required]);
  walletSelectControl: UntypedFormControl = new UntypedFormControl('', [Validators.required]);
  accountSelectControl: UntypedFormControl = new UntypedFormControl('', [Validators.required]);

  walletAccountsPublicKeys$ = this.walletSelectControl
    .valueChanges
    .pipe(startWith(this.walletsQuery.getActive()?._id))
    .pipe(switchMap(walletId =>
      this.walletsAccountsQuery.selectAll({ filterBy: entity => entity.walletId === walletId })
    ))
    .pipe(map(accounts =>
      accounts.reduce((all: { [x: string]: IWalletsAccount }, current) =>
          all[current.publicKey] ? all : ({ ...all, [current.publicKey]: current })
        , {})
    ))
    .pipe(map(data => Object.values(data)));

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly walletsQuery: WalletsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly horizonApisService: HorizonApisService,
    private readonly walletsService: WalletsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly settingsQuery: SettingsQuery,
    private readonly nzMessageService: NzMessageService,
  ) { }

  horizonValueChanged: Subscription = this.horizonSelectControl
    .valueChanges
    .pipe(withLatestFrom(this.selectedWalletAccount$))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([horizonId, walletAccount]) => {
      this.horizonApisService.selectHorizonApi(horizonId);

      this.walletsService.selectAccount({
        walletId: walletAccount.walletId,
        publicKey: walletAccount.publicKey,
      });

      this.nzMessageService.success('Horizon selected');
    });

  ngOnInit(): void {
    this.selectedHorizonApi$
      .pipe(take(1))
      .subscribe(horizon => {
        this.horizonSelectControl.setValue(horizon._id, { emitEvent: false });
      });

    this.selectedWallet$
      .pipe(take(1))
      .subscribe(horizon => {
        this.walletSelectControl.setValue(horizon._id);
      });
  }

  async onWalletAccountSelected(walletAccount: IWalletsAccount): Promise<void> {
    await this.walletsService.selectAccount({
      walletId: walletAccount.walletId,
      publicKey: walletAccount.publicKey,
    });

    this.nzMessageService.success(`Account selected`);
  }

  closeDrawer(): void {
    this.nzDrawerRef.close();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

}
