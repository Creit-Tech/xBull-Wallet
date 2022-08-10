import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsQuery, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/state';
import { debounceTime, map, skip, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import BigNumber from 'bignumber.js';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { combineLatest, forkJoin, merge, of, Subject, Subscription } from 'rxjs';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { NzMarks } from 'ng-zorro-antd/slider';

@Component({
  selector: 'app-background-image',
  templateUrl: './background-image.component.html',
  styleUrls: ['./background-image.component.scss']
})
export class BackgroundImageComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$ = new Subject<void>();

  sliderMarks: NzMarks = {
    0: '0%',
    25: '25%',
    50: '50%',
    75: '75%',
    100: '100%',
  };

  assetsWithFundsInTheWallet$ = this.walletsAccountsQuery.selectAll()
    .pipe(take(1))
    .pipe(map(accounts => {
      return accounts
        .reduce((allBalances, currentAccount) => {
          if (!!currentAccount.accountRecord) {
            const filteredBalances = this.walletsAssetsService
              .filterBalancesLines(currentAccount.accountRecord.balances);

            filteredBalances.forEach(balanceLine => {
              if (
                balanceLine.asset_type === 'native'
                  || allBalances.has(this.walletsAssetsService.formatBalanceLineId(balanceLine))
                  || new BigNumber(balanceLine.balance).isLessThanOrEqualTo(0)
              ) { return; }

              allBalances.set(this.walletsAssetsService.formatBalanceLineId(balanceLine), {
                code: balanceLine.asset_code,
                issuer: balanceLine.asset_issuer,
                balanceLineId: this.walletsAssetsService.formatBalanceLineId(balanceLine)
              });
            });
          }

          return allBalances;
        }, new Map<string, { code: string; issuer: string; balanceLineId: string }>());
    }))
    .pipe(map(mapValue => {
      return Array
        .from(mapValue)
        .map(([name, value]) => value);
    }))
    .pipe(switchMap(values => {
      return this.walletsAssetsQuery.selectMany(values.map(value => value.balanceLineId))
        .pipe(take(1));
    }))
    .pipe(map(assets => {
      return assets.reduce((allValues: Array<{ image: string; code: string }>, currentAsset) => {
        const temp = allValues || [];
        if (currentAsset.assetFullDataLoaded && !!currentAsset.image) {
          temp.push({
            image: currentAsset.image,
            code: currentAsset.assetCode,
          });
        }
        return temp;
      }, []);
    }));

  colorCoverControl = this.fb.control(0, [Validators.required]);
  backgroundImageControl = this.fb.control('', [Validators.required]);

  constructor(
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly settingsService: SettingsService,
    private readonly settingsQuery: SettingsQuery,
    private readonly fb: UntypedFormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) { }

  updateCoverSubscription: Subscription = this.colorCoverControl.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(value => {
      const percentage = new BigNumber(value || 0)
        .dividedBy(100)
        .toFixed(2);
      this.settingsService.updateBackgroundImage({
        backgroundCover: `rgba(0, 0, 0, ${percentage})`,
      });
    });

  updatedValuesSubscription: Subscription = this.backgroundImageControl.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(value => {
      this.settingsService.updateBackgroundImage({
        backgroundImg: value,
      });
    });

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    forkJoin([
      this.settingsQuery.backgroundImg$.pipe(take(1)),
      this.settingsQuery.backgroundCover$.pipe(take(1))
    ])
      .pipe(take(1))
      .subscribe(([backgroundImg, backgroundCover]) => {
        const account = new BigNumber((backgroundCover || '').slice(14, -1) || 0).multipliedBy(100).toNumber();
        this.colorCoverControl.patchValue(account, { emitEvent: false });
        this.backgroundImageControl.patchValue(backgroundImg, { emitEvent: false });
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  removeBackground(): void {
    this.settingsService.updateBackgroundImage({
      backgroundImg: undefined,
      backgroundCover: undefined,
    });
  }

}
