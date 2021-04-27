import { Component, OnInit } from '@angular/core';
import QRCode from 'qrcode';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-receive-funds',
  templateUrl: './receive-funds.component.html',
  styleUrls: ['./receive-funds.component.scss']
})
export class ReceiveFundsComponent implements OnInit {
  publicKey$: Observable<string> = of('GBQ32RYN2KMC2ZT7RJM5GIROVMKZWI254XZROD6I42G7GEAYIY4CQZR3');

  qrCode$: Observable<string> = this.publicKey$
    .pipe(switchMap(publicKey => QRCode.toDataURL(publicKey)));

  constructor() { }

  ngOnInit(): void {
  }

}
