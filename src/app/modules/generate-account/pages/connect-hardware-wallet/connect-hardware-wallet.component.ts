import { Component, OnDestroy, OnInit } from '@angular/core';
import { HardwareWalletsService } from '~root/core/services/hardware-wallets.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { ConfirmPublicKeysComponent } from '~root/modules/generate-account/components/confirm-public-keys/confirm-public-keys.component';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ConfirmTrezorKeysComponent } from '~root/modules/generate-account/components/confirm-trezor-keys/confirm-trezor-keys.component';
import {GlobalsService} from "~root/lib/globals/globals.service";
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-connect-hardware-wallet',
  templateUrl: './connect-hardware-wallet.component.html',
  styleUrls: ['./connect-hardware-wallet.component.scss']
})
export class ConnectHardwareWalletComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  trezorInitiated$ = this.hardwareWalletsService.trezorInitiated$;

  constructor(
    private readonly hardwareWalletsService: HardwareWalletsService,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly globalsService: GlobalsService,
    private readonly nzMessageService: NzMessageService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async importLedgerWallet(): Promise<void> {
    let transport;
    try {
      transport = await this.hardwareWalletsService.connectLedgerWallet();
    } catch (e: any) {
      console.error(e);
      await this.nzMessageService.error(`We were not able to connect with a Ledger wallet, make sure is connected to your computer and select it`);
      return;
    }

    const ref = await this.componentCreatorService.createOnBody<ConfirmPublicKeysComponent>(ConfirmPublicKeysComponent);
    ref.component.instance.transport = transport;

    ref.component.instance.confirmed
      .asObservable()
      .pipe(switchMap(() => ref.component.instance.onClose()))
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.showSuccessMessage();
        ref.close();
      });

    ref.component.instance.cancel
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

  async importTrezorWallet(): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<ConfirmTrezorKeysComponent>(ConfirmTrezorKeysComponent);

    ref.component.instance.confirmed
      .asObservable()
      .pipe(switchMap(() => ref.component.instance.onClose()))
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.showSuccessMessage();
        ref.close();
      });

    ref.component.instance.cancel
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

  async showSuccessMessage(): Promise<void> {
    this.nzMessageService.success(`Accounts imported correctly, this window will be closed in the next 5 seconds.`);

    await new Promise(resolve => setTimeout(resolve, 5000));

    this.globalsService.window.close();
  }

}
