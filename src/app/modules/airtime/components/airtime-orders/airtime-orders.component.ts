import { Component, OnInit } from '@angular/core';
import { AirtimeQuery } from '~root/modules/airtime/state/airtime.query';
import { BehaviorSubject } from 'rxjs';
import { AirtimeService, IAirtimeOrder } from '~root/modules/airtime/services/airtime.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { ErrorParserService } from '~root/lib/error-parser/error-parser.service';
import {
  AirtimeOrderDetailsComponent
} from '~root/modules/airtime/components/airtime-order-details/airtime-order-details.component';

@Component({
  selector: 'app-airtime-orders',
  templateUrl: './airtime-orders.component.html',
  styleUrls: ['./airtime-orders.component.scss']
})
export class AirtimeOrdersComponent implements OnInit {
  gettingOrders$ = this.airtimeQuery.gettingCountries$;
  orders$: BehaviorSubject<IAirtimeOrder[]> = new BehaviorSubject<IAirtimeOrder[]>([]);

  constructor(
    private readonly airtimeQuery: AirtimeQuery,
    private readonly airtimeService: AirtimeService,
    private readonly nzModalService: NzModalService,
    private readonly translateService: TranslateService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly errorParserService: ErrorParserService,
  ) { }

  ngOnInit(): void {
    this.airtimeService.getAccountsOrders()
      .subscribe({
        next: orders => this.orders$.next(orders),
        error: err => {
          this.nzMessageService.error(
            `${this.errorParserService.parseCTApiResponse(err)}`
          );
          this.nzDrawerRef.close();
        }
      });
  }

  openDetails(order: IAirtimeOrder): void {
    this.nzModalService.create({
      nzTitle: `${this.translateService.instant('COMMON_WORDS.ORDER')}:`,
      nzContent: AirtimeOrderDetailsComponent,
      nzData: { order },
      nzFooter: null,
    });
  }

}
