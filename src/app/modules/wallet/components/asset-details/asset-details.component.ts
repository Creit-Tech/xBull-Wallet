import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  IWalletAsset,
  IWalletIssuedAsset,
  IWalletNativeAsset,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/core/wallets/state';
import { merge, ReplaySubject, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import { SignRequestComponent } from '~root/shared/modals/components/sign-request/sign-request.component';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { TransactionBuilder, Account, Operation, Asset } from 'stellar-sdk';

@Component({
  selector: 'app-asset-details',
  templateUrl: './asset-details.component.html',
  styleUrls: ['./asset-details.component.scss']
})
export class AssetDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<boolean> = new Subject<boolean>();
  assetId$: ReplaySubject<IWalletAsset['_id']> = new ReplaySubject<IWalletAsset['_id']>();
  @Input() set assetId(data: IWalletAsset['_id']) {
    this.assetId$.next(data);
  }

  @Output() assetRemoved: EventEmitter<void> = new EventEmitter<void>();

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

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly modalsService: ModalsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  ngOnInit(): void {
    this.issuedAsset$
      .pipe(filter((asset) => !!asset))
      .pipe(take(1))
      .pipe(switchMap((asset) => {
        return this.walletsAssetsService.getAssetExtraRecord({
          _id: asset._id,
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
        })
          .pipe(map(() => asset));
      }))
      .pipe(switchMap((asset) => {
        return this.walletsAssetsService.getAssetFullRecord({
          _id: asset._id,
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
        });
      }))
      .subscribe();
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

    const loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount._id);

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

    const modalData = await this.modalsService.open<SignRequestComponent>({ component: SignRequestComponent });

    modalData.componentRef.instance.xdr = formattedXDR;

    modalData.componentRef.instance.accepted
      .asObservable()
      .pipe(switchMap(signedXdr => this.walletsAssetsService.removeAssetFromAccount(signedXdr)))
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        modalData.modalContainer.instance.onClose();
        this.assetRemoved.emit();
      });

    modalData.componentRef.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        modalData.modalContainer.instance.onClose();
      });

    this.removingAssets$
      .pipe(takeUntil(
        merge(
          modalData.modalContainer.instance.closeModal$,
          modalData.componentRef.instance.deny,
          this.componentDestroyed$
        )
      ))
      .subscribe((removingAsset: boolean) => modalData.modalContainer.instance.loading = removingAsset);

  }

}
