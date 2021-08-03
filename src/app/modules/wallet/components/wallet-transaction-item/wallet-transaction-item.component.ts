import { Component, Input, OnInit } from '@angular/core';
import { IWalletsOperation } from '~root/state';
import { ReplaySubject, Subject } from 'rxjs';
import { filter, map, pluck, tap } from 'rxjs/operators';
import { WalletsService } from '~root/core/wallets/services/wallets.service';

@Component({
  selector: 'app-wallet-transaction-item',
  templateUrl: './wallet-transaction-item.component.html',
  styleUrls: ['./wallet-transaction-item.component.scss']
})
export class WalletTransactionItemComponent implements OnInit {
  operation$: ReplaySubject<IWalletsOperation> = new ReplaySubject<IWalletsOperation>();
  @Input() set operation(data: IWalletsOperation) {
    this.operation$.next(data);
  }

  constructor(
    private readonly walletsService: WalletsService,
  ) { }

  ngOnInit(): void {
  }

}
