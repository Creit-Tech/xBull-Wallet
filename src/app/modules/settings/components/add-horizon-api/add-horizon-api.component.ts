import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { Networks } from 'stellar-sdk';

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

  form: FormGroupTyped<IAddHorizonApiForm> = new FormGroup({
    name: new FormControl('', Validators.required),
    passphrase: new FormControl('', Validators.required),
    url: new FormControl('', Validators.required),
  }) as FormGroupTyped<IAddHorizonApiForm>;

  constructor(
    private readonly toastrService: ToastrService,
    private readonly horizonApisService: HorizonApisService,
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  onConfirm(): void {
    this.toastrService.open({
      status: 'success',
      title: 'Horizon API added',
      message: 'The APIs was successfully added to the store',
    });

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