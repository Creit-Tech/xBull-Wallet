import { AfterViewInit, Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GiftCardsService, IGiftCardOrder } from '~root/modules/gift-cards/services/gift-cards.service';
import { GiftCardsQuery } from '~root/modules/gift-cards/state/gift-cards.query';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  GiftCardOrderDetailsComponent
} from '~root/modules/gift-cards/components/gift-card-order-details/gift-card-order-details.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-gift-cards-orders',
  templateUrl: './gift-cards-orders.component.html',
  styleUrls: ['./gift-cards-orders.component.scss']
})
export class GiftCardsOrdersComponent implements OnInit, AfterViewInit {
  orders$: BehaviorSubject<IGiftCardOrder[]> = new BehaviorSubject<IGiftCardOrder[]>([]);
  gettingOrders$ = this.giftCardsQuery.gettingOrders$;

  constructor(
    private readonly giftCardsQuery: GiftCardsQuery,
    private readonly giftCardsService: GiftCardsService,
    private readonly nzModalService: NzModalService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.giftCardsService.getAccountsOrders()
      .subscribe({
        next: orders => this.orders$.next(orders),
        error: err => {
          this.nzMessageService.error(
            err?.error?.message || err?.message || 'Request failed, try again or contact support'
          );
          this.nzDrawerRef.close();
        }
      });
  }

  ngAfterViewInit(): void {
  }

  openDetails(order: IGiftCardOrder): void {
    this.nzModalService.create({
      nzTitle: `${this.translateService.instant('COMMON_WORDS.ORDER')}:`,
      nzContent: GiftCardOrderDetailsComponent,
      nzComponentParams: { order },
      nzFooter: null
    });
  }

}
