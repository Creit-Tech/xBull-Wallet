import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { SettingsQuery } from '~root/state';
import { take } from 'rxjs/operators';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { Subject } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-default-fee-form',
  templateUrl: './default-fee-form.component.html',
  styleUrls: ['./default-fee-form.component.scss']
})
export class DefaultFeeFormComponent implements OnInit {
  defaultFeeControl: UntypedFormControl = new UntypedFormControl('', Validators.required);
  recommendedFee$: Subject<string> = new Subject<string>();

  gettingRecommendedFee$ = this.settingsQuery.gettingRecommendedFee$;

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly settingsService: SettingsService,
    private readonly nzMessageService: NzMessageService,
    private readonly translateService: TranslateService,
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
    this.nzMessageService.success(`${this.translateService.instant('SUCCESS_MESSAGE.VALUE_UPDATED')}: ${this.defaultFeeControl.value}`)
  }

  onGetRecommendedFee(): void {
    this.settingsService.getRecommendedFee()
      .subscribe(fee => {
        this.recommendedFee$.next(fee.toString());
        this.defaultFeeControl.patchValue(fee.toString());
      });
  }

}
