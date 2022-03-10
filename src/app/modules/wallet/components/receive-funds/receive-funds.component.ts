import { Component, OnInit } from '@angular/core';
import QRCode from 'qrcode';
import { map, switchMap } from 'rxjs/operators';
import { WalletsAccountsQuery } from '~root/state';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-receive-funds',
  templateUrl: './receive-funds.component.html',
  styleUrls: ['./receive-funds.component.scss']
})
export class ReceiveFundsComponent implements OnInit {
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  publicKey$: Observable<string> = this.selectedAccount$
    .pipe(map(selectedAccount => selectedAccount.publicKey));

  qrCode$: Observable<string> = this.publicKey$
    .pipe(switchMap(publicKey => QRCode.toDataURL(publicKey)));

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  ngOnInit(): void {
  }

}
