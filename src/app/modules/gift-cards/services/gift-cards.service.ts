import { Inject, Injectable } from '@angular/core';
import { GiftCardAccountToken, GiftCardsStore } from '~root/modules/gift-cards/state/gift-cards.store';
import { ENV, environment } from '~env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { firstValueFrom, from, Observable, of, throwError } from 'rxjs';
import { omitBy, isNil} from 'lodash';
import { Networks } from 'stellar-sdk';
import { WalletsAccountsQuery } from '~root/state';
import { GiftCardsQuery } from '~root/modules/gift-cards/state/gift-cards.query';
import { Sep10Service } from '~root/core/services/sep10/sep-10.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root'
})
export class GiftCardsService {
  sep10Url = this.env.xGCApi + '/sep10';

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly http: HttpClient,
    private readonly giftCardsStore: GiftCardsStore,
    private readonly giftCardsQuery: GiftCardsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly sep10Service: Sep10Service,
    private readonly nzMessageService: NzMessageService,
  ) { }

  // TODO: We should make the generation of the token and remove from the store in an http middleware
  async getAuthToken(): Promise<string> {
    const selectedAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$);

    let accountToken = await firstValueFrom(this.giftCardsQuery.getWalletAccountToken(selectedAccount._id));

    if (!accountToken) {
      this.nzMessageService.info('You need to authenticate with the service', {
        nzDuration: 5000,
      });
      const tokenFromApi = await this.sep10Service.authenticateWithServer(this.sep10Url, {
        account: selectedAccount.publicKey,
      });

      accountToken = {
        token: tokenFromApi,
        walletAccountId: selectedAccount._id
      };

      this.giftCardsStore.addToken(accountToken);
    }

    return accountToken.token;
  }

  removeAuthToken(token: string) {
    return (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 403) { // 403 is only returned when token is not valid anymore
          this.giftCardsStore.removeTokenByPredicate(entity => entity.token === token);
        }
      }

      return throwError(err);
    };
  }

   searchGiftCardsProducts(params: {
    countryCode?: string;
    productName?: string;
    page: number;
    size: number;
  }): Observable<ISearchedGiftCard[]> {
    this.giftCardsStore.updateUIState({ searchingProducts: true });
    return this.http.get<{ products: ISearchedGiftCard[] }>(this.env.xGCApi + '/gift-cards', {
      params: omitBy(params, isNil),
    })
      .pipe(map(response => {
        this.giftCardsStore.updateUIState({ searchingProducts: false });
        return response.products;
      }))
      .pipe(catchError(err => {
        this.giftCardsStore.updateUIState({ searchingProducts: false });
        return throwError(err);
      }));
  }

  getGiftCardProductDetails(productId: string | number): Observable<IGiftCardDetails> {
    this.giftCardsStore.updateUIState({ gettingProductDetails: true });
    return this.http.get<{ productDetails: IGiftCardDetails }>(this.env.xGCApi + `/gift-cards/${productId}`)
      .pipe(map(response => {
        this.giftCardsStore.updateUIState({ gettingProductDetails: false });
        return response.productDetails;
      }))
      .pipe(catchError(err => {
        this.giftCardsStore.updateUIState({ gettingProductDetails: false });
        return throwError(err);
      }));
  }


  // --- Authenticated routes
  getAccountsOrders(): Observable<IGiftCardOrder[]> {
    this.giftCardsStore.updateUIState({ gettingOrders: true });
    return from(this.getAuthToken())
      .pipe(switchMap(token => {
        return this.http.get<{ orders: IGiftCardOrder[] }>(this.env.xGCApi + '/orders', {
          headers: { authorization: 'Bearer ' + token },
          params: { ordersType: 'GIFT_CARD' }
        })
          .pipe(catchError(this.removeAuthToken(token)));
      }))
      .pipe(map(response => {
        this.giftCardsStore.updateUIState({ gettingOrders: false });
        return response.orders;
      }))
      .pipe(catchError(err => {
        this.giftCardsStore.updateUIState({ gettingOrders: false });
        return throwError(err);
      }));
  }

  generateOrder(params: {
    productId: IGiftCardDetails['productId'],
    amount: number,
    payingWith: string // Canonical representation of a Stellar asset
  }): Observable<{ tx: string; network: Networks }> {
    this.giftCardsStore.updateUIState({ generatingOrder: true });
    return from(this.getAuthToken())
      .pipe(switchMap(token => {
        return this.http.post<{ tx: string; network: Networks }>(this.env.xGCApi + '/orders/generate-order', params, {
          headers: { authorization: 'Bearer ' + token, APIv: '2' },
        })
          .pipe(catchError(this.removeAuthToken(token)));
      }))
      .pipe(map(response => {
        this.giftCardsStore.updateUIState({ generatingOrder: false });
        return response;
      }))
      .pipe(catchError(err => {
        this.giftCardsStore.updateUIState({ generatingOrder: false });
        return throwError(err);
      }));
  }

  confirmOrder(params: {
    orderId: string;
    tx: string;
    signatures: Array<{
      publicKey: string;
      signature: string
    }>
  }): Observable<IGiftCardOrder> {
    this.giftCardsStore.updateUIState({ confirmOrder: true });
    return from(this.getAuthToken())
      .pipe(switchMap(token => {
        return this.http.post<{ order: IGiftCardOrder }>(this.env.xGCApi + `/orders/${params.orderId}/confirm`, {
          tx: params.tx,
          signatures: params.signatures
        }, {
          headers: { authorization: 'Bearer ' + token }
        })
          .pipe(catchError(this.removeAuthToken(token)));
      }))
      .pipe(map(response => {
        this.giftCardsStore.updateUIState({ confirmOrder: false });
        return response.order;
      }))
      .pipe(catchError(err => {
        this.giftCardsStore.updateUIState({ confirmOrder: false });
        return throwError(err);
      }));
  }

  getRedeemCode(orderId: IGiftCardOrder['_id']): Observable<Array<{ cardNumber: number; pinCode: number }>> {
    this.giftCardsStore.updateUIState({ gettingRedeemCode: true });
    return from(this.getAuthToken())
      .pipe(switchMap(token => {
        return this.http.get<{ codes: Array<{ cardNumber: number; pinCode: number }>; }>(
          this.env.xGCApi + `/orders/${orderId}/redeem-code`,
          { headers: { authorization: 'Bearer ' + token } }
        )
          .pipe(catchError(this.removeAuthToken(token)));
      }))
      .pipe(map(response => {
        this.giftCardsStore.updateUIState({ gettingRedeemCode: false });
        return response.codes;
      }))
      .pipe(catchError(err => {
        this.giftCardsStore.updateUIState({ gettingRedeemCode: false });
        return throwError(err);
      }));
  }


}

export interface ISearchedGiftCard {
  productId: number;
  productName: string;
  productImage: string;
  countryCode: string;
  country: string;
  brandId: number;
  brandName: string;
}

export interface IGiftCardDetails extends ISearchedGiftCard {
  global: boolean;
  fee: number;
  feeType: 'fixed' | 'percentage';
  recipientCurrencyCode: string;
  senderCurrencyCode: string;
  optionsMaps?: Array<{ source: number; recipient: number; }>;
  minAmount?: number;
  maxAmount?: number;
  fxRate: number;
}

export interface IGiftCardOrder {
  _id: string;
  buyerPublicKey: string;
  productId: number;
  productName: string;
  orderAmount: number;
  feeAmount: number;
  totalAmount: number;
  giftCardAmount: number;
  orderStatus: string;
  cancelReason?: string;
  transactionId: string;
  createdAt: string;
}
