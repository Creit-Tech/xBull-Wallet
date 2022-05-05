import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { IWallet, IWalletsAccount, IWalletWithMnemonicPhrase, IWalletWithSecretKey, WalletsAccountsQuery, WalletsQuery } from '~root/state';
import { FormControl, Validators } from '@angular/forms';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss']
})
export class AddAccountComponent implements OnInit {
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

  secretKey: FormControl = new FormControl('', Validators.required) as FormControl;
  password: FormControl = new FormControl('', Validators.required) as FormControl;

  globalPasswordHash$: Observable<string | undefined> = this.walletsQuery.globalPasswordHash$;

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly walletsService: WalletsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsQuery: WalletsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  async onConfirm(): Promise<void> {
    const globalPasswordHash = await this.globalPasswordHash$.pipe(take(1)).toPromise();
    const hash = this.cryptoService.hashPassword(this.password.value);

    if (hash !== globalPasswordHash) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.PASSWORD_INCORRECT'));
      return;
    }

    const parentWallet = await this.parentWallet$.pipe(take(1)).toPromise();

    switch (parentWallet.type) {
      case 'mnemonic_phrase':
        await this.onConfirmMnemonicPhrase(parentWallet);
        break;

      case 'secret_key':
        await this.onConfirmSecretKey(parentWallet);
        break;
    }

    this.nzMessageService.success(
      this.translateService.instant('SETTINGS.ADD_ACCOUNT._COMPONENT.ACCOUNT_ADDED_SUCCESS', {
        name: parentWallet.name
      })
    );

    this.nzDrawerRef.close();
  }

  async onConfirmSecretKey(parentWallet: IWalletWithSecretKey): Promise<void> {
    try {
      await this.walletsService.createNewAccount({
        type: 'secret_key',
        secretKey: this.secretKey.value.trim(),
        password: this.password.value,
        walletId: parentWallet._id,
      });
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error(this.translateService.instant('SETTINGS.ADD_ACCOUNT._COMPONENT.UNABLE_TO_SAVE_ACCOUNT'));
      throw e;
    }
  }

  async onConfirmMnemonicPhrase(parentWallet: IWalletWithMnemonicPhrase): Promise<void> {
    let decryptedPhrase: string;

    try {
      decryptedPhrase = this.cryptoService.decryptText(parentWallet.mnemonicPhrase, this.password.value);
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error('We were not able to decrypt your Mnemonic Phrase');
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
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error(this.translateService.instant('SETTINGS.ADD_ACCOUNT._COMPONENT.UNABLE_TO_SAVE_ACCOUNT'));
      throw e;
    }
  }

}
