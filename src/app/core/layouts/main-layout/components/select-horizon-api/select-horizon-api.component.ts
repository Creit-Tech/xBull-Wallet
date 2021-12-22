import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { HorizonApisQuery, IHorizonApi, SettingsQuery, WalletsAccountsQuery } from '~root/state';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-select-horizon-api',
  templateUrl: './select-horizon-api.component.html',
  styleUrls: ['./select-horizon-api.component.scss']
})
export class SelectHorizonApiComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  showModal = false;

  horizonApis: Observable<IHorizonApi[]> = this.horizonApisQuery.selectAll();
  selectedHorizonApi$: Observable<IHorizonApi> = this.horizonApisQuery.getSelectedHorizonApi$;

  selectedWalletAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  advanceMode$ = this.settingsQuery.advanceMode$;

  constructor(
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly horizonApisService: HorizonApisService,
    private readonly walletsService: WalletsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly settingsQuery: SettingsQuery,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
  }

  async onHorizonApiSelected(horizon: IHorizonApi): Promise<void> {
    const walletAccount = await this.selectedWalletAccount$.pipe(take(1)).toPromise();

    this.horizonApisService.selectHorizonApi(horizon._id);

    await this.walletsService.selectAccount({
      walletId: walletAccount.walletId,
      publicKey: walletAccount.publicKey,
    });

    this.nzMessageService.success(`${horizon.name} selected`);

    this.close.emit();
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
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
