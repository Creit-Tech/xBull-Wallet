import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { SettingsQuery } from '~root/state';
import { take } from 'rxjs/operators';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-default-fee-form',
  templateUrl: './default-fee-form.component.html',
  styleUrls: ['./default-fee-form.component.scss']
})
export class DefaultFeeFormComponent implements OnInit {
  defaultFeeControl: FormControlTyped<string> = new FormControl('', Validators.required);
  recommendedFee$: Subject<string> = new Subject<string>();

  gettingRecommendedFee$ = this.settingsQuery.gettingRecommendedFee$;

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly settingsService: SettingsService,
    private readonly toastrService: ToastrService,
  ) { }

  ngOnInit(): void {
    this.settingsQuery.defaultFee$
      .pipe(take(1))
      .subscribe(defaultFee => {
        this.defaultFeeControl.patchValue(defaultFee, {
          emitEvent: false,
        });
      });
  }

  onSubmit(): void {
    this.settingsService.setDefaultFee(this.defaultFeeControl.value);
    this.toastrService.open({
      title: 'Done!',
      message: `Default fee updated to: ${this.defaultFeeControl.value}`,
      status: 'success'
    });
  }

  onGetRecommendedFee(): void {
    this.settingsService.getRecommendedFee()
      .subscribe(fee => {
        this.recommendedFee$.next(fee.toString());
      });
  }

}
