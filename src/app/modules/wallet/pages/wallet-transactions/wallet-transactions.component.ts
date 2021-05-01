import { Component, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { TransactionDetailsComponent } from '~root/modules/wallet/components/transaction-details/transaction-details.component';

@Component({
  selector: 'app-wallet-transactions',
  templateUrl: './wallet-transactions.component.html',
  styleUrls: ['./wallet-transactions.component.scss']
})
export class WalletTransactionsComponent implements OnInit {

  constructor(
    private readonly modalsService: ModalsService,
  ) { }

  ngOnInit(): void {
  }

  onSelected() {
    this.modalsService.open({ component: TransactionDetailsComponent });
  }

}
