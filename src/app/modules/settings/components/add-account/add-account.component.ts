import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { IWallet, IWalletsAccount, WalletsAccountsQuery } from '~root/state';
import { FormControl, Validators } from '@angular/forms';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';

@Component({
  selector: 'app-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss']
})
export class AddAccountComponent implements OnInit, AfterViewInit {
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  showModal = false;

  parentWallet$: ReplaySubject<IWallet> = new ReplaySubject<IWallet>();
  @Input() set parentWallet(data: IWallet) {
    this.parentWallet$.next(data);
  }

  walletAccounts$: Observable<IWalletsAccount[]> = this.parentWallet$
    .pipe(filter(wallet => !!wallet))
    .pipe(switchMap(wallet =>
      this.walletsAccountsQuery.selectAll({ filterBy: entity => entity.walletId === wallet._id })
    ));

  groupedWalletAccounts$: Observable<IWalletsAccount[]> = this.walletAccounts$
    .pipe(map(accounts =>
      accounts.reduce((all: { [publicKey: string]: IWalletsAccount }, current) => {
        return !all[current.publicKey]
          ? ({ ...all, [current.publicKey]: current })
          : all;
      }, {})
    ))
    .pipe(map(obj => Object.values(obj)));

  password: FormControlTyped<string> = new FormControl('', Validators.required) as FormControlTyped<string>;

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly toastrService: ToastrService,
    private readonly walletsService: WalletsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  ngOnInit(): void {
  }

  async onConfirmMnemonicPhrase() {
    const parentWallet = await this.parentWallet$.pipe(take(1)).toPromise();
    let decryptedPhrase: string;

    try {
      decryptedPhrase = this.cryptoService.decryptText(parentWallet.mnemonicPhrase, this.password.value);
    } catch (e) {
      console.error(e);
      this.toastrService.open({
        status: 'error',
        message: 'We were not able to decrypt your Mnemonic Phrase',
        title: 'Oh oh!'
      });
      throw e;
    }

    const walletAccounts = await this.groupedWalletAccounts$.pipe(take(1)).toPromise();

    try {
      await this.walletsService.createNewAccount({
        walletId: parentWallet._id,
        type: 'mnemonic_phrase',
        mnemonicPhrase: decryptedPhrase,
        password: this.password.value,
        path:  `m/44'/148'/${walletAccounts.length}'`
      });
    } catch (e) {
      console.error(e);
      this.toastrService.open({
        status: 'error',
        message: 'We were not able to add the new account',
        title: 'Oh oh!'
      });
      throw e;
    }

    this.toastrService.open({
      title: 'Completed.',
      message: `Your new account was added to the wallet ${parentWallet.name}`,
      status: 'success',
    });

    this.close.emit();
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}
