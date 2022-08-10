import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { IWallet } from '~root/state';
import { UntypedFormControl, Validators } from '@angular/forms';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { take, takeUntil } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-wallet-name',
  templateUrl: './edit-wallet-name.component.html',
  styleUrls: ['./edit-wallet-name.component.scss']
})
export class EditWalletNameComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  wallet$: ReplaySubject<IWallet> = new ReplaySubject<IWallet>();
  @Input() set wallet(data: IWallet) {
    this.wallet$.next(data);
  }

  nameField: UntypedFormControl = new UntypedFormControl('', Validators.required);

  constructor(
    private readonly walletsService: WalletsService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onConfirm(): Promise<void> {
    const wallet = await this.wallet$.pipe(take(1)).toPromise();
    if (!wallet) {
      // TODO: Add error here later
      return;
    }

    this.walletsService.updateWalletName(wallet._id, this.nameField.value);

    this.nzMessageService.success(`${this.translateService.instant('SUCCESS_MESSAGE.VALUE_UPDATED')}: "${this.nameField.value}"`);

    this.nzDrawerRef.close();
  }

}
