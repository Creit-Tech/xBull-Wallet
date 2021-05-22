import { Component, Input, OnInit } from '@angular/core';
import { IWalletsOperation, IWalletsPaymentOperation } from '~root/core/wallets/state';
import { ReplaySubject, Subject } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

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

  payment$: Observable<IWalletsPaymentOperation> = this.operation$
    .asObservable()
    .pipe(filter(operation => operation.type === 'payment')) as Observable<IWalletsPaymentOperation>;

  constructor() { }

  ngOnInit(): void {
  }

}
