import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import QRCode from 'qrcode';
import { WalletsAccountsQuery } from '~root/state';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-receive-payment',
  templateUrl: './receive-payment.component.html',
  styleUrls: ['./receive-payment.component.scss']
})
export class ReceivePaymentComponent implements OnInit {
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
