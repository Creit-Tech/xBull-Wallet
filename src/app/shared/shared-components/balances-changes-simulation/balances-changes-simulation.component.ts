import { Component, Input } from '@angular/core';
import { Asset, FeeBumpTransaction, Networks, rpc as SorobanRpc, Transaction } from '@stellar/stellar-sdk';
import { BehaviorSubject, firstValueFrom, Observable, ReplaySubject, switchMap } from 'rxjs';
import { IAssetBalanceChange, StateChangesService } from '~root/core/services/state-changes/state-changes.service';
import {
  HorizonApisQuery,
  INetworkApi,
  IWalletAssetModel,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-balances-changes-simulation',
  templateUrl: './balances-changes-simulation.component.html',
  styleUrl: './balances-changes-simulation.component.scss'
})
export class BalancesChangesSimulationComponent {
  transaction$: ReplaySubject<Transaction | FeeBumpTransaction> = new ReplaySubject<Transaction | FeeBumpTransaction>(0);
  @Input() set transaction(data: Transaction | FeeBumpTransaction | null) {
    if (!!data ){
      this.transaction$.next(data);
      this.simulateAndGetChanges(data);
    }
  }

  changes$: BehaviorSubject<IAssetBalanceChange[]> = new BehaviorSubject<IAssetBalanceChange[]>([]);

  changesEntries$: Observable<Array<IAssetBalanceChange & { walletAsset?: IWalletAssetModel }>> = this.changes$
    .pipe(map(changes => {
      const result: Array<IAssetBalanceChange & { walletAsset?: IWalletAssetModel }> = [];
      for (const change of changes) {
        const asset = this.walletsAssetsQuery.getEntity(this.walletsAssetsService.assetIdFromAssetString(change.asset));
        result.push({ ...change, walletAsset: asset });
      }
      return result;
    }));

  show$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly stateChangesService: StateChangesService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
  ) {}

  async simulateAndGetChanges(tx: Transaction | FeeBumpTransaction): Promise<void> {
    const selectedHorizon: INetworkApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);
    if (!selectedHorizon.rpcUrl) {
      console.log('No RPC url has been set in the network');
      return;
    }

    const rpc: SorobanRpc.Server = new SorobanRpc.Server(selectedHorizon.rpcUrl);

    try {
      const sim = await rpc.simulateTransaction(tx);

      if (!SorobanRpc.Api.isSimulationSuccess(sim)) {
        throw new Error(sim.error);
      }

      const selectedAccount: IWalletsAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$);

      const changes = this.stateChangesService.parseBalanceChanges({
        account: selectedAccount.publicKey,
        entriesDifferences: sim.stateChanges || []
      });

      for (const change of changes) {
        const asset: Asset = this.walletsAssetsService.sdkAssetFromAssetString(change.asset);
        this.walletsAssetsService.requestAssetInformation$.next({
          asset: {
            _id: this.walletsAssetsService.assetIdFromAssetString(change.asset),
            assetCode: asset.code,
            assetIssuer: asset.issuer,
            networkPassphrase: selectedHorizon.networkPassphrase,
          },
          forceUpdate: true,
          horizonApi: selectedHorizon,
        });
      }

      this.changes$.next(changes);

      this.show$.next(true);

    } catch (e) {
      console.error(e);
    }
  }
}
