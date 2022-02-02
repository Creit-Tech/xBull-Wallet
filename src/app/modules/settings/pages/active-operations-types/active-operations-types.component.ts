import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
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
  form = new FormGroup({
    create_account: new FormControl(false),
    payment: new FormControl(false),
    path_payment_strict_receive: new FormControl(false),
    path_payment_strict_send: new FormControl(false),
    create_passive_sell_offer: new FormControl(false),
    manage_sell_offer: new FormControl(false),
    manage_buy_offer: new FormControl(false),
    set_options: new FormControl(false),
    change_trust: new FormControl(false),
    allow_trust: new FormControl(false),
    account_merge: new FormControl(false),
    manage_data: new FormControl(false),
    bump_sequence: new FormControl(false),
    create_claimable_balance: new FormControl(false),
    claim_claimable_balance: new FormControl(false),
    begin_sponsoring_future_reserves: new FormControl(false),
    end_sponsoring_future_reserves: new FormControl(false),
    revoke_sponsorship: new FormControl(false),
    clawback: new FormControl(false),
    clawback_claimable_balance: new FormControl(false),
    set_trust_line_flags: new FormControl(false),
    liquidity_pool_deposit: new FormControl(false),
    liquidity_pool_withdraw: new FormControl(false),
  });

  get values(): FormArray {
    return this.form.controls.values as FormArray;
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
