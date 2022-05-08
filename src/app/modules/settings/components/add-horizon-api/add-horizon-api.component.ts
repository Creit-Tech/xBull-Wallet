import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { Networks } from 'stellar-sdk';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-horizon-api',
  templateUrl: './add-horizon-api.component.html',
  styleUrls: ['./add-horizon-api.component.scss']
})
export class AddHorizonApiComponent implements OnInit {

  passphraseOptions = [{
    name: 'Mainnet',
    value: Networks.PUBLIC
  }, {
    name: 'Testnet',
    value: Networks.TESTNET
  }];

  form: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    passphrase: new FormControl('', Validators.required),
    url: new FormControl('', Validators.required),
  });

  constructor(
    private readonly horizonApisService: HorizonApisService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly translateService: TranslateService,
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
