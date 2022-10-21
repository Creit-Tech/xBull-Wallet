import { Component, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { GiftCardsService, IGiftCardOrder } from '~root/modules/gift-cards/services/gift-cards.service';
import { take } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { GiftCardsQuery } from '~root/modules/gift-cards/state/gift-cards.query';

@Component({
  selector: 'app-gift-card-order-details',
  templateUrl: './gift-card-order-details.component.html',
  styleUrls: ['./gift-card-order-details.component.scss']
})
export class GiftCardOrderDetailsComponent implements OnInit {
  order$: ReplaySubject<IGiftCardOrder> = new ReplaySubject<IGiftCardOrder>();
  set order(data: IGiftCardOrder | undefined) {
    if (!!data) {
      this.order$.next(data);
    }
  }

  redeemCodes: Array<{ cardNumber: number; pinCode: number }> = [];
  gettingRedeemCode$ = this.giftCardsQuery.gettingRedeemCode$;

  constructor(
    private readonly giftCardsService: GiftCardsService,
    private readonly giftCardsQuery: GiftCardsQuery,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
  }

  async getCodes(): Promise<void> {
    const order = await this.order$.pipe(take(1)).toPromise();
    this.giftCardsService.getRedeemCode(order._id)
      .subscribe({
        next: data => {
          this.redeemCodes = data;
        },
        error: err => {
          this.nzMessageService.error(
            err?.error?.message || err?.message || `There was an error when getting the codes, please contact support`,
          );
        }
      });
  }

}
