import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CountriesService } from '~root/core/services/countries/countries.service';
import { FormControl, FormGroup } from '@angular/forms';
import { GiftCardsQuery } from '~root/modules/gift-cards/state/gift-cards.query';
import { GiftCardsService, ISearchedGiftCard } from '~root/modules/gift-cards/services/gift-cards.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  GiftCardDetailsComponent
} from '~root/modules/gift-cards/components/gift-card-details/gift-card-details.component';
import {
  GiftCardsOrdersComponent
} from '~root/modules/gift-cards/components/gift-cards-orders/gift-cards-orders.component';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-gift-cards-search',
  templateUrl: './gift-cards-search.component.html',
  styleUrls: ['./gift-cards-search.component.scss']
})
export class GiftCardsSearchComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$ = new Subject<void>();
  searchDataForm: FormGroup<IGiftSearch> = new FormGroup<IGiftSearch>({
    country: new FormControl<string | null>('US'),
    search: new FormControl<string | null>(''),
  });

  countriesData = this.countriesService.getCountriesValue();

  products$: BehaviorSubject<ISearchedGiftCard[]> = new BehaviorSubject<ISearchedGiftCard[]>([]);

  searchingProducts$ = this.giftCardsQuery.searchingProducts$;

  constructor(
    private readonly countriesService: CountriesService,
    private readonly giftCardsQuery: GiftCardsQuery,
    private readonly giftCardsService: GiftCardsService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
    this.getProducts();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  getProducts(): void {
    this.giftCardsService.searchGiftCardsProducts({
      countryCode: this.searchDataForm.value.country || undefined,
      productName: this.searchDataForm.value.search || '',
      page: 1,
      size: 200
    })
      .subscribe({
        next: data => {
          this.products$.next(data);
        },
        error: err => {
          this.nzMessageService.error(
            this.translateService.instant('GIFT_CARDS.CANT_GET_PRODUCTS'),
            { nzDuration: 5000 }
          );
        }
      });
  }

  openProductDetails(searchedGiftCard: ISearchedGiftCard): void {
    this.nzDrawerService.create({
      nzTitle: searchedGiftCard.productName,
      nzPlacement: 'right',
      nzContent: GiftCardDetailsComponent,
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzContentParams: {
        productId: searchedGiftCard.productId,
      }
    });
  }

  openOrders(): void {
    this.nzDrawerService.create({
      nzTitle: this.translateService.instant('GIFT_CARDS.MY_ORDERS'),
      nzPlacement: 'right',
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzContent: GiftCardsOrdersComponent,
    });
  }

}

interface IGiftSearch {
  country: FormControl<string | null>;
  search: FormControl<string | null>;
}
