import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { IWallet } from '~root/state';
import { FormControl, Validators } from '@angular/forms';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-edit-wallet-name',
  templateUrl: './edit-wallet-name.component.html',
  styleUrls: ['./edit-wallet-name.component.scss']
})
export class EditWalletNameComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  showModal = false;

  wallet$: ReplaySubject<IWallet> = new ReplaySubject<IWallet>();
  @Input() set wallet(data: IWallet) {
    this.wallet$.next(data);
  }

  nameField: FormControlTyped<string> = new FormControl('', Validators.required);

  constructor(
    private readonly walletsService: WalletsService,
    private readonly toastrService: ToastrService,
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    this.wallet$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(wallet => {
        this.nameField.patchValue(wallet.name);
      });

    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
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

    this.toastrService.open({
      title: 'Process completed',
      message: `Wallet's name updated to "${this.nameField.value}"`,
      status: 'success',
    });

    this.onClose();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}
