import { AfterViewInit, Component, OnInit } from '@angular/core';
import {
  AirtimeService,
  IAirtimeCountry,
  IAirtimeCountryOperator
} from '~root/modules/airtime/services/airtime.service';
import { BehaviorSubject, merge, Observable, of, scheduled } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map, mergeAll, startWith, switchMap, take, tap } from 'rxjs/operators';
import { AirtimeQuery } from '~root/modules/airtime/state/airtime.query';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  MobileTopupSummaryComponent
} from '~root/modules/airtime/components/mobile-topup-summary/mobile-topup-summary.component';
import {
  GiftCardsOrdersComponent
} from '~root/modules/gift-cards/components/gift-cards-orders/gift-cards-orders.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { AirtimeOrdersComponent } from '~root/modules/airtime/components/airtime-orders/airtime-orders.component';

@Component({
  selector: 'app-mobile-topup',
  templateUrl: './mobile-topup.component.html',
  styleUrls: ['./mobile-topup.component.scss']
})
export class MobileTopupComponent implements OnInit, AfterViewInit {
  countries$: BehaviorSubject<IAirtimeCountry[]> = new BehaviorSubject<IAirtimeCountry[]>([]);
  operators$: BehaviorSubject<IAirtimeCountryOperator[]> = new BehaviorSubject<IAirtimeCountryOperator[]>([]);

  gettingCountries$ = this.airtimeQuery.gettingCountries$;
  gettingCountryOperators$ = this.airtimeQuery.gettingCountryOperators$;

  form: FormGroup<IForm> = new FormGroup<IForm>({
    currentStep: new FormControl<number>(0),
    countryCode: new FormControl<string | null>(null, Validators.required),
    operatorId: new FormControl<number | null>(null, Validators.required),
    amount: new FormControl<number | null>(null, Validators.required),
    phoneAreaCode: new FormControl<string | null>(null, Validators.required),
    phone: new FormControl<string | null>(null, Validators.required),
  });

  selectedCountry: IAirtimeCountry | undefined;
  selectedCountry$: Observable<IAirtimeCountry | undefined> = this.form.controls.countryCode.valueChanges
    .pipe(startWith(this.form.value.countryCode))
    .pipe(switchMap(countryCode => {
      return this.countries$
        .pipe(map(countries => countries.find(country => country.isoName === countryCode)));
    }))
    .pipe(tap(country => this.selectedCountry = country));

  selectedOperator: IAirtimeCountryOperator | undefined;
  selectedOperator$: Observable<IAirtimeCountryOperator | undefined> = this.form.controls.operatorId.valueChanges
    .pipe(switchMap(operatorId => {
      return this.operators$
        .pipe(map(operators => operators.find(operator => operator.id === operatorId)));
    }))
    .pipe(tap(operator => this.selectedOperator = operator));

  constructor(
    private readonly airtimeService: AirtimeService,
    private readonly airtimeQuery: AirtimeQuery,
    private readonly nzModalService: NzModalService,
    private readonly nzDrawerService: NzDrawerService,
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.airtimeService.getCountries()
      .subscribe(countries => {
        this.countries$.next(countries);
      });
  }

  confirmCountry(): void {
    if (!this.form.controls.countryCode.value) {
      return;
    }

    this.airtimeService.getCountryOperators(this.form.controls.countryCode.value)
      .subscribe(data => {
        this.operators$.next(data);
        this.form.controls.currentStep.patchValue(1);
      });
  }

  goBackToStep1(): void {
    this.operators$.next([]);
    this.form.patchValue({
      currentStep: 0,
      operatorId: null,
      countryCode: null,
    });
  }

  confirmOperator(): void {
    this.form.patchValue({ currentStep: 2 });
  }

  goBackToStep2(): void {
    this.form.patchValue({
      currentStep: 1,
      phoneAreaCode: null,
      phone: null,
      amount: null,
    });
  }

  async openSummary(): Promise<void> {
    if (
      !this.selectedOperator ||
      !this.selectedCountry ||
      !this.form.value.amount ||
      !this.form.value.phoneAreaCode ||
      !this.form.value.phone
    ) {
      return;
    }

    this.nzModalService.create<MobileTopupSummaryComponent>({
      nzContent: MobileTopupSummaryComponent,
      nzComponentParams: {
        amount: this.form.value.amount,
        operator: this.selectedOperator,
        phone: this.form.value.phoneAreaCode + this.form.value.phone,
        country: this.selectedCountry,
      },
      nzTitle: '',
      nzOkText: 'Confirm',
      nzFooter: null
    });
  }

  openOrders(): void {
    this.nzDrawerService.create({
      nzTitle: '',
      nzPlacement: 'right',
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzContent: AirtimeOrdersComponent,
    });
  }

}

interface IForm {
  currentStep: FormControl<number | null>;
  countryCode: FormControl<string | null>;
  operatorId: FormControl<number | null>;
  amount: FormControl<number | null>;
  phoneAreaCode: FormControl<string | null>;
  phone: FormControl<string | null>;
}
