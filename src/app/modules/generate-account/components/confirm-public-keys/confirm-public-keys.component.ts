import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SettingsQuery } from '~root/state';
import { HardwareWalletsService } from '~root/core/services/hardware-wallets.service';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-confirm-public-keys',
  templateUrl: './confirm-public-keys.component.html',
  styleUrls: ['./confirm-public-keys.component.scss']
})
export class ConfirmPublicKeysComponent implements OnInit, AfterViewInit {
  showModal = false;

  @Input() transport!: TransportWebUSB;
  @Output() confirmed: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  accountsToAdd$: BehaviorSubject<Array<{ publicKey: string; path: string; active: boolean }>> = new BehaviorSubject<Array<{ publicKey: string; path: string; active: boolean }>>([]);

  advanceMode$ = this.settingsQuery.advanceMode$;

  form = new UntypedFormGroup({
    accounts: new UntypedFormArray([]),
  });

  get accounts(): UntypedFormArray {
    return this.form.controls.accounts as UntypedFormArray;
  }

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly hardwareWalletsService: HardwareWalletsService,
    private readonly walletsService: WalletsService,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;

    await this.getAccounts();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.cancel.emit();
  }

  async getAccounts(): Promise<void> {
    this.loading$.next(true);
    const newAccounts = [];
    let firstAccount: string | null = null;

    try {
      let index = this.accounts.controls.length;
      const lastIndex = index + 4;

      while (index < lastIndex) {
        const path = `44'/148'/${index}'`;
        const key = await this.hardwareWalletsService.getLedgerPublicKey(path, this.transport);

        if (!firstAccount) {
          firstAccount = key;
        }

        this.accounts.push(new UntypedFormGroup({
          publicKey: new UntypedFormControl(key),
          path: new UntypedFormControl(path),
          active: new UntypedFormControl(true),
        }));

        newAccounts.push({ key, path, active: false });
        index++;
      }

      if (newAccounts.every(account => account.key === firstAccount)) {
        this.nzMessageService.error(`We can't get the accounts from your wallet, please make sure your wallet is unlocked and with the Stellar App opened`, {
          nzDuration: 5000,
        });
        await this.onClose();
        return;
      }

      this.loading$.next(false);
    } catch (e: any) {
      console.log(e);
      this.loading$.next(false);
    }
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
      productId: this.transport.device.productId,
      vendorId: (this.transport.device.vendorId),
      type: 'ledger_wallet',
      accounts: selectedAccounts,
    });

    this.confirmed.emit();

  }

}
