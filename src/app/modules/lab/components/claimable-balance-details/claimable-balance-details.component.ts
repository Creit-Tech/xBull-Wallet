import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  Server,
  ServerApi,
  Account,
  TransactionBuilder,
  Operation,
  Asset,
  LiquidityPoolId,
  LiquidityPoolAsset
} from 'stellar-sdk';
import { ReplaySubject, Subject } from 'rxjs';
import { pluck, take, takeUntil } from 'rxjs/operators';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { ClaimableBalancesQuery, HorizonApisQuery, WalletsAccountsQuery } from '~root/state';
import { SignXdrComponent } from '~root/shared/modals/components/sign-xdr/sign-xdr.component';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { ClaimableBalancesService } from '~root/core/services/claimable-balances.service';
import {WalletsAssetsService} from "~root/core/wallets/services/wallets-assets.service";

@Component({
  selector: 'app-claimable-balance-details',
  templateUrl: './claimable-balance-details.component.html',
  styleUrls: ['./claimable-balance-details.component.scss']
})
export class ClaimableBalanceDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  claimingBalance$ = this.claimableBalancesQuery.claimingBalance$;

  showModal = false;
  @Output() deny: EventEmitter<void> = new EventEmitter<void>();
  @Output() accept: EventEmitter<string> = new EventEmitter<string>();

  claimableBalanceRecord$: ReplaySubject<ServerApi.ClaimableBalanceRecord> = new ReplaySubject<ServerApi.ClaimableBalanceRecord>();
  @Input() set claimableBalanceRecord(data: ServerApi.ClaimableBalanceRecord) {
    this.claimableBalanceRecord$.next(data);
  }

  constructor(
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly toastrService: ToastrService,
    private readonly claimableBalancesService: ClaimableBalancesService,
    private readonly claimableBalancesQuery: ClaimableBalancesQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  assetToText(asset: string): string {
    return asset === 'native'
      ? 'XLM'
      : asset.split(':')[0];
  }

  assetIssuerToText(asset: string): string | 'native' {
    return asset === 'native'
      ? 'native'
      : asset.split(':')[1];
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  async onClaim(): Promise<void> {
    const [
      record,
      selectedAccount,
      selectedHorizonApi
    ] = await Promise.all([
      this.claimableBalanceRecord$.pipe(take(1)).toPromise(),
      this.walletsAccountsQuery.getSelectedAccount$.pipe(take(1)).toPromise(),
      this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1)).toPromise(),
    ]);

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

    const transactionXDR = transaction.build().toXDR();

    const ref = await this.componentCreatorService.createOnBody<SignXdrComponent>(SignXdrComponent);

    ref.component.instance.xdr = transactionXDR;

    ref.component.instance.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((signedXdr) => {
        this.sendTransaction(signedXdr);
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.component.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.close();
      });

    ref.open();
  }

  async sendTransaction(signedXdr: string): Promise<void> {
    try {
      await this.claimableBalancesService.claimBalance(signedXdr);

      this.toastrService.open({
        message: 'Funds have been added to your balances',
        status: 'success',
        title: 'Balance claimed'
      });
      this.accept.emit();
    } catch (e) {
      this.toastrService.open({
        message: 'We were not able to complete the operation.',
        status: 'error',
        title: 'Oops!'
      });
    }
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.deny.emit();
  }

}
