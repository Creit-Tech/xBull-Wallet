import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { Networks } from 'stellar-sdk';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SettingsQuery } from '~root/state';

@Component({
  selector: 'app-add-horizon-api',
  templateUrl: './add-horizon-api.component.html',
  styleUrls: ['./add-horizon-api.component.scss']
})
export class AddHorizonApiComponent implements OnInit {

  passphraseOptions$: Observable<Array<{ name: string; value: string }>> = of(
    Object.keys(Networks)
      .map((key: any) => ({
        name: key,
        value: (Networks as any)[key],
      }))
  );

  form: UntypedFormGroup = new UntypedFormGroup({
    name: new UntypedFormControl('', Validators.required),
    passphrase: new UntypedFormControl('', Validators.required),
    url: new UntypedFormControl('', Validators.required),
  });

  constructor(
    private readonly horizonApisService: HorizonApisService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly translateService: TranslateService,
    private readonly settingsQuery: SettingsQuery,
  ) { }

  ngOnInit(): void {
  }

  onConfirm(): void {
    this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));

    this.horizonApisService.addHorizonApi({
      networkPassphrase: this.form.value.passphrase,
      url: this.form.value.url,
      name: this.form.value.name,
      canRemove: true,
    });

    this.onClose();
  }

  async onClose(): Promise<void> {
    this.nzDrawerRef.close();
  }

}

interface IAddHorizonApiForm {
  name: string;
  passphrase: string;
  url: string;
}
