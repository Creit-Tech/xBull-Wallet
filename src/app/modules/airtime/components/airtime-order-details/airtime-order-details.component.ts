import { Component, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { IAirtimeOrder } from '~root/modules/airtime/services/airtime.service';

@Component({
  selector: 'app-airtime-order-details',
  templateUrl: './airtime-order-details.component.html',
  styleUrls: ['./airtime-order-details.component.scss']
})
export class AirtimeOrderDetailsComponent implements OnInit {
  order$: ReplaySubject<IAirtimeOrder> = new ReplaySubject<IAirtimeOrder>();
  set order(data: IAirtimeOrder | undefined) {
    if (!!data) {
      this.order$.next(data);
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

}
