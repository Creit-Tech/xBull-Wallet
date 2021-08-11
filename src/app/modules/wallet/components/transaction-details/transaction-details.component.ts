import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { HorizonApisQuery, IWalletsOperation } from '~root/state';
import { ReplaySubject } from 'rxjs';
import { filter, map, pluck, take } from 'rxjs/operators';
import { GlobalsService } from '~root/lib/globals/globals.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Networks } from 'stellar-sdk';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss'],
})
export class TransactionDetailsComponent implements OnInit {
  operation$: ReplaySubject<IWalletsOperation> = new ReplaySubject<IWalletsOperation>();
  @Input() set operation(data: IWalletsOperation) {
    this.operation$.next(data);
  }

  constructor(
    private readonly globalsService: GlobalsService,
    private readonly horizonApisQuery: HorizonApisQuery,
  ) { }

  ngOnInit(): void {
  }

  async checkOnBlockchain(): Promise<void> {
    const selectedHorizonApi = await this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1))
      .toPromise();

    const network = selectedHorizonApi.networkPassphrase === Networks.PUBLIC
      ? 'public'
      : 'testnet';

    const operation = await this.operation$.pipe(take(1)).toPromise();
    // TODO: This needs to be dynamic
    this.globalsService.window.open(
      `https://stellar.expert/explorer/${network}/tx/${operation.operationRecord.transaction_hash}`,
      '_blank'
    );
  }

}
