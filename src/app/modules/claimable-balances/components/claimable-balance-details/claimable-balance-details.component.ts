import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import {
  ClaimableBalancesQuery, HorizonApisQuery,
  IWalletAssetModel, WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import { Account, Asset, Operation, Server, ServerApi, TransactionBuilder } from 'stellar-sdk';
import { BehaviorSubject, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { debounceTime, map, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { ClaimableBalancesService } from '~root/core/services/claimable-balances.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsOffersService } from '~root/core/wallets/services/wallets-offers.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-claimable-balance-details',
  templateUrl: './claimable-balance-details.component.html',
  styleUrls: ['./claimable-balance-details.component.scss']
})
export class ClaimableBalanceDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  claimableBalanceId$: ReplaySubject<string> = new ReplaySubject<string>();
  claimableBalance$ = this.claimableBalanceId$
    .pipe(switchMap(claimableBalanceId => this.claimableBalancesQuery.selectEntity(claimableBalanceId)));

  claimingBalance$ = this.claimableBalancesQuery.claimingBalance$;

  disableActionButtons$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  @Input()
  set claimableBalanceId(data: string) {
    this.claimableBalanceId$.next(data);
  }

  asset$: Observable<IWalletAssetModel | undefined> = this.claimableBalance$
    .pipe(switchMap(claimableBalance => {
      if (!claimableBalance) {
        return of(undefined);
      }

      const assetId = this.walletsAssetsService.assetIdFromAssetString(claimableBalance.asset);

      return this.walletsAssetsQuery.selectEntity(assetId);
    }));

  claimant$ = this.claimableBalance$
    .pipe(withLatestFrom(this.walletsAccountsQuery.getSelectedAccount$))
    .pipe(map(([claimableBalance, selectedAccount]) => {
      return claimableBalance?.claimants.find(claimant => {
        return claimant.destination === selectedAccount.publicKey;
      });
    }));

  buttonTriggered$: Subject<'claim_it' | 'trash_it'> = new Subject<'claim_it' | 'trash_it'>();

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly claimableBalancesQuery: ClaimableBalancesQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly claimableBalancesService: ClaimableBalancesService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly translateService: TranslateService,
  ) { }

  buttonTriggeredSubscription: Subscription = this.buttonTriggered$
    .asObservable()
    .pipe(debounceTime(100))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(async type => {
      this.disableActionButtons$.next(true);
      try {
        await this.onClaim(type);
      } catch (e) {
        console.error(e);
      }
      this.disableActionButtons$.next(false);
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onClaim(type: 'claim_it' | 'trash_it'): Promise<void> {
    const [
      record,
      selectedAccount,
      selectedHorizonApi
    ] = await Promise.all([
      this.claimableBalance$.pipe(take(1)).toPromise(),
      this.walletsAccountsQuery.getSelectedAccount$.pipe(take(1)).toPromise(),
      this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1)).toPromise(),
    ]);

    if (!record || !selectedAccount || !selectedHorizonApi) {
      return;
    }

    const asset = record.asset === 'native'
      ? Asset.native()
      : new Asset(record.asset.split(':')[0], record.asset.split(':')[1]);

    const loadedAccount = await new Server(selectedHorizonApi.url).loadAccount(selectedAccount.publicKey);

    const targetAccount = new Account(loadedAccount.accountId(), loadedAccount.sequence);

    const transaction = new TransactionBuilder(targetAccount, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: selectedHorizonApi.networkPassphrase,
    }).setTimeout(this.stellarSdkService.defaultTimeout);

    if (!asset.isNative()) {
      const alreadyTrust = !!this.walletsAssetsService.filterBalancesLines(loadedAccount.balances)
        .find(balance => {
          return balance.asset_type !== 'native'
            && balance.asset_code === asset.code
            && balance.asset_issuer === asset.issuer;
        });

      if (!alreadyTrust) {
        transaction.addOperation(
          Operation.changeTrust({ asset })
        );
      }
    }

    transaction.addOperation(
      Operation.claimClaimableBalance({
        balanceId: record.id
      })
    );

    if (type === 'trash_it' && !asset.isNative()) {
      let pathRecords: ServerApi.PaymentPathRecord[] = [];
      try {
        pathRecords = await this.stellarSdkService.Server.strictSendPaths(
          asset,
          record.amount,
          [this.stellarSdkService.SDK.Asset.native()],
        ).call()
          .then(r => r.records);
      } catch (e) {}

      if (pathRecords.length > 0) {
        transaction.addOperation(
          this.stellarSdkService.SDK.Operation.pathPaymentStrictSend({
            destination: selectedAccount.publicKey,
            sendAsset: asset,
            destAsset: this.stellarSdkService.SDK.Asset.native(),
            destMin: '0.0000001',
            sendAmount: record.amount,
            path: pathRecords[0].path.map(data => {
              return data.asset_type === 'native'
                ? this.stellarSdkService.SDK.Asset.native()
                : new this.stellarSdkService.SDK.Asset(data.asset_code, data.asset_issuer);
            })
          })
        );
      } else {
        transaction.addOperation(
          this.stellarSdkService.SDK.Operation.payment({
            asset,
            destination: asset.getIssuer(),
            amount: record.amount,
          })
        );
      }

      transaction.addOperation(
        Operation.changeTrust({
          asset,
          limit: '0'
        })
      );
    }

    const transactionXDR = transaction.build().toXDR();

    const ref = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'ios-safe-y drawer-full-w-320',
      nzTitle: 'Claim Airdrop',
      nzContentParams: {
        xdr: transactionXDR,
        acceptHandler: async signedXdr => {
          try {
            await this.claimableBalancesService.claimBalance(signedXdr);
            this.claimableBalancesService.removeClaimableBalance(record._id);
            this.nzDrawerRef.close();
            this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));
          } catch (e: any) {
            this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'));
          }
        }
      }
    });

    ref.open();
  }

}
