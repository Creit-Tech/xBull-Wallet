import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  HorizonApisQuery, IHorizonApi,
  IWalletAsset, IWalletAssetModel,
  IWalletIssuedAsset,
  IWalletNativeAsset,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/state';
import { merge, Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { TransactionBuilder, Account, Operation, Asset } from 'stellar-sdk';
import { SignXdrComponent } from '~root/shared/modals/components/sign-xdr/sign-xdr.component';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-asset-details',
  templateUrl: './asset-details.component.html',
  styleUrls: ['./asset-details.component.scss']
})
export class AssetDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<boolean> = new Subject<boolean>();
  assetId$: ReplaySubject<IWalletAsset['_id']> = new ReplaySubject<IWalletAsset['_id']>();
  @Input() set assetId(data: IWalletAsset['_id']) {
    this.assetId$.next(data);
  }

  @Output() assetRemoved: EventEmitter<void> = new EventEmitter<void>();
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  asset$ = this.assetId$
    .pipe(switchMap(assetId => this.walletsAssetsQuery.getAssetsById([assetId])))
    .pipe(map(assets => assets.shift()));

  nativeAsset$: Observable<IWalletAssetModel> = this.asset$
    .pipe(filter(asset => !!asset && asset._id === 'native')) as any;

  issuedAsset$: Observable<IWalletAssetModel> = this.asset$
    .pipe(filter(asset => !!asset && asset._id !== 'native')) as any;

  fullDataLoaded$: Observable<boolean | undefined> = this.asset$
    .pipe(map(asset => !!asset && asset.assetFullDataLoaded));

  removingAssets$ = this.walletsAssetsQuery.removingAsset$;
  showModal = false;

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly modalsService: ModalsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly horizonApiQuery: HorizonApisQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.issuedAsset$
      .pipe(filter((asset) => !!asset))
      .pipe(take(1))
      .pipe(withLatestFrom(this.horizonApiQuery.getSelectedHorizonApi$))
      .subscribe(([asset, horizonApi]: [IWalletAssetModel, IHorizonApi]) => {
        this.walletsAssetsService.requestAssetData$.next({
          ...asset,
          horizonApi,
        });
      });
  }

  async ngAfterViewInit(): Promise<void> {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onRemove(): Promise<void> {
    const [
      horizonApi,
      selectedAccount,
      asset,
    ] = await Promise.all([
      this.horizonApisQuery.getSelectedHorizonApi$
        .pipe(take(1))
        .toPromise(),
      this.walletsAccountsQuery.getSelectedAccount$.pipe(take(1)).toPromise(),
      this.asset$.pipe(take(1)).toPromise() as Promise<IWalletAsset<'issued'>>,
    ]);

    if (!selectedAccount || !asset) {
      return;
    }

    const loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount.publicKey);

    const targetAccount = new Account(loadedAccount.accountId(), loadedAccount.sequence);

    const formattedXDR = new TransactionBuilder(targetAccount, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset: new Asset(asset.assetCode, asset.assetIssuer),
          limit: '0',
        })
      )
      .setTimeout(this.stellarSdkService.defaultTimeout)
      .build()
      .toXDR();

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'ios-safe-y drawer-full-w-320',
      nzTitle: 'Remove Asset',
      nzContentParams: {
        xdr: formattedXDR,
        acceptHandler: async signedXdr => {
          if (!signedXdr) {
            this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
            return;
          }

          try {
            await this.walletsAssetsService.removeAssetFromAccount(signedXdr);
            this.nzMessageService.success(this.translateService.instant('WALLET.ASSET_DETAILS.ASSET_REMOVE_SUCCESS'));
            this.nzDrawerRef.close();
          } catch (e) {
            console.error(e);
            this.nzMessageService.success(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'), {
              nzDuration: 5000,
            });
            return;
          }

          this.walletsAccountsService.getAccountData({
            account: selectedAccount,
            horizonApi
          }).toPromise()
            .then()
            .catch(e => console.error(e));
        }
      }
    });

  }

  closeDrawer(): void {
    this.nzDrawerRef.close();
  }

}
