import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom, merge, Observable, Subject } from 'rxjs';
import { map, pluck, switchMap, take, takeUntil } from 'rxjs/operators';
import {
  HorizonApisQuery,
  IWallet,
  IWalletsAccount,
  WalletAccountType,
  WalletsAccountsQuery,
  WalletsQuery
} from '~root/state';
import { UntypedFormControl, Validators } from '@angular/forms';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ClipboardService } from '~root/core/services/clipboard.service';
import { PasswordModalComponent } from '~root/shared/shared-modals/components/password-modal/password-modal.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { Networks } from '@stellar/stellar-sdk';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wallet-account',
  templateUrl: './wallet-account.component.html',
  styleUrls: ['./wallet-account.component.scss']
})
export class WalletAccountComponent implements OnInit {
  componentDestroyed$: Subject<boolean> = new Subject<boolean>();
  walletId$: Observable<string> = this.route.params.pipe(pluck('walletId'));
  wallet$: Observable<IWallet> = this.walletId$
    .pipe(switchMap(walletId => {
      return this.walletsQuery.selectEntity(walletId) as Observable<IWallet>;
    }));

  publicKey: Observable<string> = this.route.params.pipe(pluck('publicKey'));
  account$: Observable<IWalletsAccount> = combineLatest([
    this.publicKey,
    this.horizonApisQuery.getSelectedHorizonApi$
  ])
    .pipe(switchMap(([publicKey, horizonApi]) => {
      const accountId = this.walletsService.generateWalletAccountId({
        publicKey,
        network: horizonApi.networkPassphrase as Networks,
      });
      return this.walletsAccountsQuery.selectEntity(accountId) as Observable<IWalletsAccount>;
    }));

  accountNameControl = new UntypedFormControl('', [Validators.required]);
  editingName = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalService: NzModalService,
    private readonly clipboardService: ClipboardService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly cryptoService: CryptoService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsService: WalletsService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.account$
      .pipe(take(1))
      .subscribe(account => {
        this.accountNameControl.setValue(account.name);
      });
  }

  async saveName(): Promise<void> {
    if (this.accountNameControl.invalid) {
      return;
    }

    const account = await firstValueFrom(this.account$);

    try {
      await this.walletsAccountsService.setAccountName({
        name: this.accountNameControl.value.trim(),
        publicKey: account.publicKey,
      });
    } catch (e: any) {
      this.nzMessageService.error(e.message || this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
      return;
    }

    this.editingName = false;
  }

  async copyPrivateKey(): Promise<any> {
    this.nzModalService.confirm({
      nzTitle: this.translateService.instant('SETTINGS.WALLET_ACCOUNT.COPY_PRIVATE_KEY_TITLE'),
      nzContent: this.translateService.instant('SETTINGS.WALLET_ACCOUNT.COPY_PRIVATE_KEY_CONTENT'),
      nzOnOk: async () => {
        const account = await firstValueFrom(this.account$);

        if (account.type !== WalletAccountType.with_secret_key) {
          // TODO: toast this
          throw new Error('Selected account is not a private key based account');
        }

        const drawerRef = this.nzDrawerService.create<PasswordModalComponent>({
          nzContent: PasswordModalComponent,
          nzPlacement: 'bottom',
          nzTitle: '',
          nzHeight: 'auto',
          nzWrapClassName: 'ios-safe-y'
        });

        drawerRef.open();

        await firstValueFrom(drawerRef.afterOpen);

        const componentRef = drawerRef.getContentComponent();

        if (!componentRef) {
          return;
        }

        componentRef.password
          .pipe(take(1))
          .pipe(map((password) => {
            return this.cryptoService.decryptText(account.secretKey, password);
          }))
          .pipe(takeUntil(merge(
            this.componentDestroyed$,
            drawerRef.afterClose
          )))
          .subscribe(secretKey => {
            this.clipboardService.copyToClipboard(secretKey);
            this.nzMessageService.success(this.translateService.instant('SETTINGS.WALLET_ACCOUNT.COPY_PRIVATE_KEY_CONTENT_SUCCESS'), {
              nzDuration: 5000
            });
            drawerRef.close();
          }, error => {
            drawerRef.close();
            console.log(error);
            this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_SIGN_TRANSACTION'));
          });

      }
    });
  }

  async removeAccount(): Promise<any> {
    this.nzModalService.confirm({
      nzTitle: this.translateService.instant('SETTINGS.WALLET_ACCOUNT.REMOVE_ACCOUNT_TITLE'),
      nzContent: this.translateService.instant('SETTINGS.WALLET_ACCOUNT.REMOVE_ACCOUNT_CONTENT'),
      nzOnOk: async () => {
        const walletId = await this.walletId$.pipe(take(1)).toPromise();
        const publicKey = await this.publicKey.pipe(take(1)).toPromise();
        const accounts = await firstValueFrom(this.walletsAccountsQuery.selectAll({
          filterBy: entity => entity.publicKey === publicKey && walletId === entity.walletId,
        }));

        this.router.navigate(['/settings/wallets', walletId])
          .then(() => {
            this.walletsAccountsService.removeAccounts(accounts.map(a => a._id));
          });
      }
    });
  }

}
