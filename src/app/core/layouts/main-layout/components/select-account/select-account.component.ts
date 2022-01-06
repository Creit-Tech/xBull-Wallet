import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { filter, map, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { IWallet, IWalletsAccount, WalletsAccountsQuery, WalletsQuery } from '~root/state';
import { ISelectOptions } from '~root/shared/forms-components/select/select.component';
import { FormControl, Validators } from '@angular/forms';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-select-account',
  templateUrl: './select-account.component.html',
  styleUrls: ['./select-account.component.scss']
})
export class SelectAccountComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  showModal = false;

  wallets$ = this.walletsQuery.selectAll();
  selectedWalletId$ = this.walletsQuery.getSelectedWallet$;

  walletSelect: FormControlTyped<string> = new FormControl('', Validators.required);

  walletAccountsPublicKeys$ = this.walletSelect.valueChanges
    .pipe(switchMap(walletId =>
      this.walletsAccountsQuery.selectAll({ filterBy: entity => entity.walletId === walletId })
    ))
    .pipe(map(accounts =>
      accounts.reduce((all: { [x: string]: IWalletsAccount }, current) =>
        all[current.publicKey] ? all : ({ ...all, [current.publicKey]: current })
      , {})
    ))
    .pipe(map(data => Object.values(data)));

  selectedWalletAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  newWalletSelected: Subscription = this.walletSelect.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((value) => {

    });

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsService: WalletsService,
    private readonly nzMessageService: NzMessageService
  ) { }

  ngOnInit(): void {
  }

  async onWalletSelected(walletAccount: IWalletsAccount): Promise<void> {
    await this.walletsService.selectAccount({
      walletId: walletAccount.walletId,
      publicKey: walletAccount.publicKey,
    });

    this.nzMessageService.success(`Account ${walletAccount.name} selected`);

    this.close.emit();
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;

    this.selectedWalletId$
      .pipe(take(1))
      .subscribe(wallet => {
        this.walletSelect.patchValue(wallet._id, { emitEvent: true });
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}
