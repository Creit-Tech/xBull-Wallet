import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { IAnchor } from '~root/modules/anchors/state/anchor.model';
import { AnchorsQuery } from '~root/modules/anchors/state/anchors.query';
import { StellarTomlResolver } from 'stellar-sdk';
import { HttpClient } from '@angular/common/http';
import { ISep24InfoResponse, Sep24Service } from '~root/core/services/sep24/sep24.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Sep10Service } from '~root/core/services/sep10/sep-10.service';
import { WalletsAccountsQuery } from '~root/state';
import {
  AnchorsService,
  IAnchorCurrency,
} from '~root/modules/anchors/services/anchors.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  AnchoredAssetInteractionDrawerComponent
} from '~root/modules/anchors/components/anchored-asset-interaction-drawer/anchored-asset-interaction-drawer.component';
import { AnchorsAuthTokensQuery } from '~root/modules/anchors/state/anchors-auth-tokens.query';
import { createAnchorsAuthTokenId } from '~root/modules/anchors/state/anchors-auth-token.model';

@Component({
  selector: 'app-anchor-details',
  templateUrl: './anchor-details.component.html',
  styleUrls: ['./anchor-details.component.scss']
})
export class AnchorDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$ = new Subject();

  anchorId$: Observable<IAnchor['_id']> = this.route.params.pipe(map(params => params.anchorId));
  anchor$: Observable<IAnchor | undefined> = this.anchorId$
    .pipe(switchMap((anchorId) => this.anchorsQuery.selectEntity(anchorId)));

  currencies$: BehaviorSubject<IAnchorCurrency[]> = new BehaviorSubject<IAnchorCurrency[]>([]);
  selectedWalletAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  anchorAuthTokenString$: Observable<string | undefined> = combineLatest([
    this.anchorId$.pipe(distinctUntilChanged()),
    this.selectedWalletAccount$.pipe(map(a => a?.publicKey)).pipe(distinctUntilChanged())
  ])
    .pipe(switchMap(data => {
      return this.anchorsAuthTokensQuery.selectEntity(createAnchorsAuthTokenId({
        anchorId: data[0],
        publicKey: data[1],
      }));
    }))
    .pipe(map(data => data?.token));

  loading = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly anchorsQuery: AnchorsQuery,
    private readonly http: HttpClient,
    private readonly sep24Service: Sep24Service,
    private readonly nzMessageService: NzMessageService,
    private readonly sep10Service: Sep10Service,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly anchorsService: AnchorsService,
    private readonly anchorsAuthTokensQuery: AnchorsAuthTokensQuery,
  ) { }

  getAnchorDetailsSubscription: Subscription = this.anchorId$
    .pipe(switchMap((anchorId) => {
      return this.anchorsQuery.selectEntity(anchorId)
        .pipe(take(1));
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(async anchor => {
      if (!!anchor) {
        this.loading = true;
        let parsedToml;
        const url = new URL(anchor.url);
        try {
          parsedToml = await StellarTomlResolver.resolve(url.hostname);
        } catch (e) {
          this.nzMessageService.error('We were not able to get the .toml file from the anchor');
          return;
        }
        this.updateAnchorCurrencies(anchor, parsedToml)
          .then(() => this.loading = false)
          .catch(() => this.loading = false);
      }
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async updateAnchorCurrencies(anchor: IAnchor, parsedToml: any): Promise<void> {
    let serverInfo: ISep24InfoResponse;
    try {
      serverInfo = await this.sep24Service.getInfo(anchor.transferServerSep24).toPromise();
    } catch (e) {
      this.nzMessageService.error('We were not able to get updated info data from the Anchor');
      return;
    }

    const currencies = parsedToml.CURRENCIES || parsedToml.currencies;
    const parsedCurrencies: IAnchorCurrency[] = currencies.map((currency: any): IAnchorCurrency => ({
      code: currency.code,
      issuer: currency.issuer,
      image: currency.image,
      deposit: {
        enabled: !!serverInfo.deposit[currency.code]?.enabled,
        minAmount: serverInfo.deposit[currency.code]?.min_amount,
        maxAmount: serverInfo.deposit[currency.code]?.max_amount,
        feeFixed: serverInfo.deposit[currency.code]?.fee_fixed,
        feePercentage: serverInfo.deposit[currency.code]?.fee_percent,
        feeMin: serverInfo.deposit[currency.code]?.fee_minimum,
      },
      withdraw: {
        enabled: !!serverInfo.withdraw[currency.code]?.enabled,
        minAmount: serverInfo.withdraw[currency.code]?.min_amount,
        maxAmount: serverInfo.withdraw[currency.code]?.max_amount,
        feeFixed: serverInfo.withdraw[currency.code]?.fee_fixed,
        feePercentage: serverInfo.withdraw[currency.code]?.fee_percent,
        feeMin: serverInfo.withdraw[currency.code]?.fee_minimum,
      },
    }));

    this.currencies$.next(parsedCurrencies);
  }

  async openAssetInteractionDrawer(anchorCurrency: IAnchorCurrency): Promise<void> {
    const anchor = await this.anchor$.pipe(take(1)).toPromise();
    const selectedAccount = await this.selectedWalletAccount$.pipe(take(1)).toPromise();
    const anchorAuthTokenString = await this.anchorAuthTokenString$.pipe(take(1)).toPromise();

    if (!anchor || !selectedAccount) {
      return;
    }

    let authToken: string | undefined = anchorAuthTokenString;
    if (!authToken) {
      this.nzMessageService.info('You need to authenticate with the Anchor');
      try {
        authToken = await this.anchorsService.authenticateWithAnchor(
          anchor,
          selectedAccount.publicKey
        );
      } catch (e) {
        console.error(e);
        this.nzMessageService.error('Authentication with the anchor failed');
        return;
      }
    }

    this.nzDrawerService.create<AnchoredAssetInteractionDrawerComponent>({
      nzContent: AnchoredAssetInteractionDrawerComponent,
      nzPlacement: 'right',
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzTitle: anchorCurrency.code,
      nzContentParams: {
        anchor,
        anchorAuthTokenString: authToken,
        anchorCurrency,
        walletAccount: selectedAccount,
      }
    });
  }

  removeAnchor(id: IAnchor['_id']): void {
    this.router.navigate(['/anchors'])
      .then(_ => this.anchorsService.removeAnchor(id));
  }
}
