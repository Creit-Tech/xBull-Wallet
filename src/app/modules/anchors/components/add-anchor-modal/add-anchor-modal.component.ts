import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnchorsService } from '~root/modules/anchors/services/anchors.service';
import { createAnchor } from '~root/modules/anchors/state/anchor.model';
import { Networks } from 'soroban-client';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-add-anchor-modal',
  templateUrl: './add-anchor-modal.component.html',
  styleUrls: ['./add-anchor-modal.component.scss']
})
export class AddAnchorModalComponent implements OnInit {
  currentStep$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  fetchingTomlData = false;

  urlControl: FormControl<string | null> = new FormControl<string | null>('', [
    Validators.required,
  ]);

  anchorDataForm: FormGroup<IAnchorFormData> = new FormGroup<IAnchorFormData>({
    name: new FormControl(''),
    url: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    image: new FormControl(''),
    email: new FormControl(''),
    networkPassphrase: new FormControl(Networks.PUBLIC, [Validators.required]),
    signingKey: new FormControl('', [Validators.required]),
    webAuthEndpoint: new FormControl('', [Validators.required]),
    transferServerSep24: new FormControl('', [Validators.required]),
  });

  constructor(
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzMessageService: NzMessageService,
    private readonly anchorsService: AnchorsService,
    private readonly nzModalRef: NzModalRef,
  ) { }

  ngOnInit(): void {
  }

  async fetchData(): Promise<void> {
    if (!this.urlControl.value) {
      return;
    }

    this.fetchingTomlData = true;

    let toml: any;
    try {
      toml = await this.stellarSdkService.SDK.StellarTomlResolver.resolve(this.urlControl.value);
    } catch (e) {
      this.fetchingTomlData = false;
      this.nzMessageService.error('Not possible to get the .toml file from this domain');
      return;
    }

    this.anchorDataForm.patchValue({
      name: toml?.DOCUMENTATION?.ORG_DBA || toml?.DOCUMENTATION?.ORG_NAME,
      description: toml?.DOCUMENTATION?.ORG_DESCRIPTION,
      url: `https://${this.urlControl.value}`,
      email: toml?.DOCUMENTATION?.ORG_OFFICIAL_EMAIL || toml?.DOCUMENTATION?.ORG_SUPPORT_EMAIL,
      image: toml?.DOCUMENTATION?.ORG_LOGO,
      networkPassphrase: toml?.NETWORK_PASSPHRASE,
      signingKey: toml?.SIGNING_KEY,
      transferServerSep24: toml?.TRANSFER_SERVER_SEP0024,
      webAuthEndpoint: toml?.WEB_AUTH_ENDPOINT,
    });

    this.currentStep$.next(1);
    this.fetchingTomlData = false;
  }

  async confirmAdd(): Promise<void> {
    if (this.anchorDataForm.invalid) {
      return;
    }

    const anchorData = createAnchor({
      name: this.anchorDataForm.value.name || '',
      url: this.anchorDataForm.value.url || '',
      description: this.anchorDataForm.value.description || '',
      image: this.anchorDataForm.value.image || '',
      email: this.anchorDataForm.value.email || '',
      networkPassphrase: this.anchorDataForm.value.networkPassphrase || Networks.PUBLIC,
      signingKey: this.anchorDataForm.value.signingKey || '',
      webAuthEndpoint: this.anchorDataForm.value.webAuthEndpoint || '',
      transferServerSep24: this.anchorDataForm.value.transferServerSep24 || '',
      canBeRemoved: true,
    });

    this.anchorsService.addAnchor(anchorData);
    this.nzMessageService.success('Anchor added');
    this.nzModalRef.close();
  }

}

interface IAnchorFormData {
  name: FormControl<string | null>;
  url: FormControl<string | null>;
  description: FormControl<string | null>;
  image: FormControl<string | null>;
  email: FormControl<string | null>;
  networkPassphrase: FormControl<Networks | null>;
  signingKey: FormControl<string | null>;
  webAuthEndpoint: FormControl<string | null>;
  transferServerSep24: FormControl<string | null>;
}
