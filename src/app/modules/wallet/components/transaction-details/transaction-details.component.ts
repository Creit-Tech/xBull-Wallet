import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { IWalletsOperation } from '~root/state';
import { ReplaySubject } from 'rxjs';
import { filter, map, pluck, take } from 'rxjs/operators';
import { GlobalsService } from '~root/lib/globals/globals.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';

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
  ) { }

  ngOnInit(): void {
  }

  async checkOnBlockchain(): Promise<void> {
    const operation = await this.operation$.pipe(take(1)).toPromise();
    // TODO: This needs to be dynamic
    this.globalsService.window.open(
      `https://stellar.expert/explorer/testnet/tx/${operation.operationRecord.transaction_hash}`,
      '_blank'
    );
  }

}
