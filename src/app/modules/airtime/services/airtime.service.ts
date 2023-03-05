import { Inject, Injectable } from '@angular/core';
import { ENV, environment } from '~env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AirtimeStore } from '~root/modules/airtime/state/airtime.store';
import { AirtimeQuery } from '~root/modules/airtime/state/airtime.query';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { Networks } from 'soroban-client';
import { IGiftCardOrder } from '~root/modules/gift-cards/services/gift-cards.service';
import { Sep10Service } from '~root/core/services/sep10/sep-10.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsAccountsQuery } from '~root/state';

@Injectable({
  providedIn: 'root'
})
export class AirtimeService {
  sep10Url = this.env.xGCApi + '/sep10';

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly http: HttpClient,
    private readonly airtimeStore: AirtimeStore,
    private readonly airtimeQuery: AirtimeQuery,
    private readonly sep10Service: Sep10Service,
    private readonly nzMessageService: NzMessageService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  // TODO: We should make the generation of the token and remove from the store in an http middleware
  async getAuthToken(): Promise<string> {
    const selectedAccount = await this.walletsAccountsQuery.getSelectedAccount$
      .pipe(take(1))
      .toPromise();

    let accountToken = await this.airtimeQuery.getWalletAccountToken(selectedAccount._id)
      .pipe(take(1))
      .toPromise();

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

      this.airtimeStore.addToken(accountToken);
    }

    return accountToken.token;
  }

  removeAuthToken(token: string): any {
    return (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 403) { // 403 is only returned when token is not valid anymore
          this.airtimeStore.removeTokenByPredicate(entity => entity.token === token);
        }
      }

      return throwError(err);
    };
  }

  getCountries(): Observable<IAirtimeCountry[]> {
    this.airtimeStore.updateUIState({ gettingCountries: true });
    return this.http.get<{ countries: IAirtimeCountry[] }>(this.env.xGCApi + '/airtime/countries')
      .pipe(map(data => {
        this.airtimeStore.updateUIState({ gettingCountries: false });
        return data.countries;
      }))
      .pipe(catchError(err => {
        this.airtimeStore.updateUIState({ gettingCountries: false });
        return throwError(err);
      }));
  }

  getCountryOperators(countryCode: string): Observable<IAirtimeCountryOperator[]> {
    this.airtimeStore.updateUIState({ gettingCountryOperators: true });
    return this.http.get<{ operators: IAirtimeCountryOperator[] }>(this.env.xGCApi + `/airtime/countries/${countryCode}/operators`)
      .pipe(map(data => {
        this.airtimeStore.updateUIState({ gettingCountryOperators: false });
        return data.operators;
      }))
      .pipe(catchError(err => {
        this.airtimeStore.updateUIState({ gettingCountryOperators: false });
        return throwError(err);
      }));
  }

  // --- Authenticated routes
  getAccountsOrders(): Observable<IAirtimeOrder[]> {
    this.airtimeStore.updateUIState({ gettingOrders: true });
    return from(this.getAuthToken())
      .pipe(switchMap(token => {
        return this.http.get<{ orders: IAirtimeOrder[] }>(this.env.xGCApi + '/orders', {
          headers: { authorization: 'Bearer ' + token },
          params: { ordersType: 'AIRTIME' }
        })
          .pipe(catchError(this.removeAuthToken(token)));
      }))
      .pipe(map(response => {
        this.airtimeStore.updateUIState({ gettingOrders: false });
        return response.orders;
      }))
      .pipe(catchError(err => {
        this.airtimeStore.updateUIState({ gettingOrders: false });
        return throwError(err);
      }));
  }

  generateOrder(params: {
    amount: number;
    operatorId: string;
    recipientPhone: string;
    payingWith: string // Canonical representation of a Stellar asset
    countryCode: string;
  }): Observable<{ tx: string; network: Networks }> {
    this.airtimeStore.updateUIState({ generatingOrder: true });
    return from(this.getAuthToken())
      .pipe(switchMap(authToken => {
        return this.http.post<{ tx: string; network: Networks }>(this.env.xGCApi + '/orders/generate-airtime-order', params, {
          headers: { authorization: 'Bearer ' + authToken, APIv: '2' },
        })
          .pipe(catchError(this.removeAuthToken(authToken)));
      }))
      .pipe(map(response => {
        this.airtimeStore.updateUIState({ generatingOrder: false });
        return response;
      }))
      .pipe(catchError(err => {
        this.airtimeStore.updateUIState({ generatingOrder: false });
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
    this.airtimeStore.updateUIState({confirmOrder: true});
    return from(this.getAuthToken())
      .pipe(switchMap(token => {
        return this.http.post<{ order: IGiftCardOrder }>(this.env.xGCApi + `/orders/${ params.orderId }/confirm`, {
          tx: params.tx,
          signatures: params.signatures
        }, {
          headers: {authorization: 'Bearer ' + token}
        })
          .pipe(catchError(this.removeAuthToken(token)));
      }))
      .pipe(map(response => {
        this.airtimeStore.updateUIState({confirmOrder: false});
        return response.order;
      }))
      .pipe(catchError(err => {
        this.airtimeStore.updateUIState({confirmOrder: false});
        return throwError(err);
      }));
  }
}

export interface IAirtimeCountry {
  isoName: string;
  name: string;
  continent: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  flag: string;
  callingCodes: string[];
}

export interface IAirtimeCountryOperator {
  id: number;
  name: string;
  denominationType: 'FIXED' | 'RANGE';
  destinationCurrencyCode: string;
  destinationCurrencySymbol: string;
  optionsMaps?: Array<{
    source: number;
    recipient: number;
  }>;
  minAmount?: number;
  maxAmount?: number;
  fxRate: number;
  fee: number;
}

export interface IAirtimeOrder {
  _id: string;
  buyerPublicKey: string;
  productId: number;
  productName: string;
  orderAmount: number;
  feeAmount: number;
  totalAmount: number;
  recipientPhoneNumber: string;
  countryCode: string;
  orderStatus: string;
  cancelReason?: string;
  transactionId: string;
  createdAt: string;
}
