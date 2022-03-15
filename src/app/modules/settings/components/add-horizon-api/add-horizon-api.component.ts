import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { Networks } from 'stellar-sdk';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-add-horizon-api',
  templateUrl: './add-horizon-api.component.html',
  styleUrls: ['./add-horizon-api.component.scss']
})
export class AddHorizonApiComponent implements OnInit, AfterViewInit {
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  showModal = false;

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
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  onConfirm(): void {
    this.nzMessageService.success('The APIs was successfully added to the store');

    this.horizonApisService.addHorizonApi({
      networkPassphrase: this.form.value.passphrase,
      url: this.form.value.url,
      name: this.form.value.name,
      canRemove: true,
    });

    this.close.emit();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}

interface IAddHorizonApiForm {
  name: string;
  passphrase: string;
  url: string;
}
