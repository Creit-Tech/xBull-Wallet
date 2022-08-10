import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { SettingsQuery, WalletsOperationsQuery } from '~root/state';
import { take, takeUntil } from 'rxjs/operators';
import { SettingsService } from '~root/core/settings/services/settings.service';

@Component({
  selector: 'app-active-operations-types',
  templateUrl: './active-operations-types.component.html',
  styleUrls: ['./active-operations-types.component.scss']
})
export class ActiveOperationsTypesComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  form = new UntypedFormGroup({
    create_account: new UntypedFormControl(false),
    payment: new UntypedFormControl(false),
    path_payment_strict_receive: new UntypedFormControl(false),
    path_payment_strict_send: new UntypedFormControl(false),
    create_passive_sell_offer: new UntypedFormControl(false),
    manage_sell_offer: new UntypedFormControl(false),
    manage_buy_offer: new UntypedFormControl(false),
    set_options: new UntypedFormControl(false),
    change_trust: new UntypedFormControl(false),
    allow_trust: new UntypedFormControl(false),
    account_merge: new UntypedFormControl(false),
    manage_data: new UntypedFormControl(false),
    bump_sequence: new UntypedFormControl(false),
    create_claimable_balance: new UntypedFormControl(false),
    claim_claimable_balance: new UntypedFormControl(false),
    begin_sponsoring_future_reserves: new UntypedFormControl(false),
    end_sponsoring_future_reserves: new UntypedFormControl(false),
    revoke_sponsorship: new UntypedFormControl(false),
    clawback: new UntypedFormControl(false),
    clawback_claimable_balance: new UntypedFormControl(false),
    set_trust_line_flags: new UntypedFormControl(false),
    liquidity_pool_deposit: new UntypedFormControl(false),
    liquidity_pool_withdraw: new UntypedFormControl(false),
  });

  get values(): UntypedFormArray {
    return this.form.controls.values as UntypedFormArray;
  }

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly settingsService: SettingsService,
  ) { }

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => this.setNewState());

    this.settingsQuery
      .operationTypesToShow$
      .pipe(take(1))
      .subscribe(operationTypesToShow => {
        this.form.patchValue(operationTypesToShow.reduce((all, current) => {
          return { ...all, [current]: true };
        }, {}), { emitEvent: false });
      });
  }

  setNewState(): void {
    const newValue: string[] = [];

    for (const key of Object.keys(this.form.value)) {
      if (this.form.value[key]) {
        newValue.push(key);
      }
    }

    this.settingsService.setOperationsToShow(newValue);
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
  }

}
