import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HardwareWalletsService } from '~root/core/services/hardware-wallets.service';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { StellarAddress, Success, Unsuccessful } from 'trezor-connect';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { SettingsQuery } from '~root/state';
import { WalletsService } from '~root/core/wallets/services/wallets.service';

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

  form = new FormGroup({
    accounts: new FormArray([]),
    walletId: new FormControl('', Validators.required),
  });

  get accounts(): FormArray {
    return this.form.controls.accounts as FormArray;
  }

  constructor(
    private readonly hardwareWalletsService: HardwareWalletsService,
    private readonly toastrService: ToastrService,
    private readonly settingsQuery: SettingsQuery,
    private readonly walletsService: WalletsService,
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
    } catch (e) {
      console.error(e);
      await this.toastrService.open({
        message: `There was an error we didn't expect, try again or contact support`,
        title: `Ups!`,
        status: 'error',
        timer: 5000,
      });
      return;
    }

    if (!response.success) {
      await this.toastrService.open({
        message: response.payload.error,
        title: `We can't continue`,
        status: 'error',
        timer: 5000,
      });
      return;
    }

    response.payload.forEach(record => {
      this.accounts.push(new FormGroup({
        publicKey: new FormControl(record.address),
        path: new FormControl(record.serializedPath),
        active: new FormControl(true),
      }));
    });

    console.log({ response });
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
