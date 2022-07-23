import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HardwareWalletsService } from '~root/core/services/hardware-wallets.service';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { StellarAddress, Success, Unsuccessful } from 'trezor-connect';
import { SettingsQuery } from '~root/state';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-confirm-trezor-keys',
  templateUrl: './confirm-trezor-keys.component.html',
  styleUrls: ['./confirm-trezor-keys.component.scss']
})
export class ConfirmTrezorKeysComponent implements OnInit {
  showModal = false;
  @Output() confirmed: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  advanceMode$ = this.settingsQuery.advanceMode$;

  form = new UntypedFormGroup({
    accounts: new UntypedFormArray([]),
    walletId: new UntypedFormControl('', Validators.required),
  });

  get accounts(): UntypedFormArray {
    return this.form.controls.accounts as UntypedFormArray;
  }

  constructor(
    private readonly hardwareWalletsService: HardwareWalletsService,
    private readonly settingsQuery: SettingsQuery,
    private readonly walletsService: WalletsService,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;

    await new Promise(resolve => setTimeout(resolve, 300));
    await this.requestAccounts();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.cancel.emit();
  }

  async requestAccounts(): Promise<void> {
    const amountOfAccountsLoaded = this.accounts.length;
    let response: Unsuccessful | Success<StellarAddress[]>;
    try {
      response = await this.hardwareWalletsService.getTrezorPublicKeys({
        start: amountOfAccountsLoaded,
        end: amountOfAccountsLoaded + 4,
      });
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error(`There was an error we didn't expect, try again or contact support`, {
        nzDuration: 5000
      });
      return;
    }

    if (!response.success) {
      this.nzMessageService.error(`We can't continue`, {
        nzDuration: 5000,
      });
      return;
    }

    response.payload.forEach(record => {
      this.accounts.push(new UntypedFormGroup({
        publicKey: new UntypedFormControl(record.address),
        path: new UntypedFormControl(record.serializedPath),
        active: new UntypedFormControl(true),
      }));
    });
  }

  async onConfirm(): Promise<void> {
    const selectedAccounts: Array<{ publicKey: string; path: string }> = this.form.value.accounts
      .filter((account: { active: boolean, publicKey: string; path: string }) => {
        return account.active;
      });

    if (selectedAccounts.length === 0) {
      return;
    }

    await this.walletsService.generateNewWallet({
      type: 'trezor_wallet',
      walletId: this.form.value.walletId,
      accounts: selectedAccounts,
    });

    this.confirmed.emit();

  }

}
