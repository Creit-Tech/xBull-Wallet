import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  HorizonApisQuery,
  IWalletAsset,
  IWalletIssuedAsset,
  IWalletNativeAsset,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/state';
import { merge, ReplaySubject, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { TransactionBuilder, Account, Operation, Asset } from 'stellar-sdk';
import { SignXdrComponent } from '~root/shared/modals/components/sign-xdr/sign-xdr.component';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';

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

  nativeAsset$: Observable<IWalletNativeAsset<'full'>> = this.asset$
    .pipe(filter(asset => !!asset && asset._id === 'native')) as any;

  issuedAsset$: Observable<IWalletIssuedAsset<'full'>> = this.asset$
    .pipe(filter(asset => !!asset && asset._id !== 'native')) as any;

  fullDataLoaded$: Observable<boolean> = this.asset$
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
  ) { }

  ngOnInit(): void {
    this.issuedAsset$
      .pipe(filter((asset) => !!asset))
      .pipe(take(1))
      .pipe(withLatestFrom(this.horizonApiQuery.getSelectedHorizonApi$))
      .pipe(switchMap(([asset, horizonApi]) => {
        return this.walletsAssetsService.getAssetExtraRecord({
          _id: asset._id,
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
          horizonApi,
        })
          .pipe(map(() => asset));
      }))
      .pipe(withLatestFrom(this.horizonApiQuery.getSelectedHorizonApi$))
      .pipe(switchMap(([asset, horizonApi]) => {
        return this.walletsAssetsService.getAssetFullRecord({
          _id: asset._id,
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
          horizonApi
        });
      }))
      .subscribe();
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onRemove(): Promise<void> {
    const [
      selectedAccount,
      asset,
    ] = await Promise.all([
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

    const ref = await this.componentCreatorService.createOnBody<SignXdrComponent>(SignXdrComponent);

    ref.component.instance.xdr = formattedXDR;

    ref.component.instance.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .pipe(tap(async () => {
        await ref.component.instance.onClose();
        await ref.close();
      }))
      .pipe(switchMap(signedXdr => this.walletsAssetsService.removeAssetFromAccount(signedXdr)))
      .subscribe(() => {
        this.assetRemoved.emit();
      });

    ref.component.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(merge(this.componentDestroyed$, ref.destroyed$.asObservable())))
      .subscribe(() => {
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}
