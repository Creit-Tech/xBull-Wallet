import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { Networks } from '@stellar/stellar-sdk';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { INetworkApi, SettingsQuery } from '~root/state';

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
    name: new UntypedFormControl(this.data?.networkApi?.name || '', Validators.required),
    passphrase: new UntypedFormControl(this.data?.networkApi?.networkPassphrase || '', Validators.required),
    url: new UntypedFormControl(this.data?.networkApi?.url ||'', Validators.required),
    rpc: new UntypedFormControl(this.data?.networkApi?.rpcUrl ||'', Validators.required),
  });

  constructor(
    @Inject(NZ_DRAWER_DATA)
    private readonly data: { networkApi?: INetworkApi } | undefined,
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

    if (!this.data?.networkApi) {
      this.horizonApisService.addHorizonApi({
        networkPassphrase: this.form.value.passphrase,
        url: this.form.value.url,
        rpcUrl: this.form.value.rpc,
        name: this.form.value.name,
        canRemove: true,
      });
    } else {
      this.horizonApisService.updateApi({
        ...this.data!.networkApi,
        networkPassphrase: this.form.value.passphrase,
        url: this.form.value.url,
        rpcUrl: this.form.value.rpc,
        name: this.form.value.name,
      })
    }

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
