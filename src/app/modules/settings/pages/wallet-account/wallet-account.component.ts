import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, merge, Observable, Subject } from 'rxjs';
import { distinctUntilKeyChanged, map, pluck, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import {
  HorizonApisQuery,
  IWallet,
  IWalletsAccount,
  IWalletsAccountWithSecretKey,
  WalletsAccountsQuery,
  WalletsQuery
} from '~root/state';
import { FormControl, Validators } from '@angular/forms';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ClipboardService } from '~root/core/services/clipboard.service';
import { PasswordModalComponent } from '~root/shared/modals/components/password-modal/password-modal.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { Networks } from 'stellar-base';

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

  accountNameControl = new FormControl('', [Validators.required]);
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

    const account = await this.account$.pipe(take(1)).toPromise();

    try {
      await this.walletsAccountsService.setAccountName({
        name: this.accountNameControl.value.trim(),
        publicKey: account.publicKey,
      });
    } catch (e) {
      this.nzMessageService.error(e.message || 'Unexpected error, please contact support');
      return;
    }

    this.editingName = false;
  }

  async copyPrivateKey(): Promise<any> {
    await this.nzModalService.confirm({
      nzTitle: 'Please read carefully',
      nzContent: `You're about to copy your private key to the clipboard. We recommend you that after you have use it, copy something else so is removed from your clipboard and if your device keep clipboard records, delete it from there too.`,
      nzOnOk: async () => {
        const account = await this.account$.pipe(take(1))
          .toPromise() as IWalletsAccountWithSecretKey;

        const drawerRef = this.nzDrawerService.create<PasswordModalComponent>({
          nzContent: PasswordModalComponent,
          nzPlacement: 'bottom',
          nzTitle: '',
          nzHeight: 'auto'
        });

        drawerRef.open();

        await drawerRef.afterOpen.pipe(take(1)).toPromise();

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
            this.nzMessageService.success('Copied to the clipboard, do not forget about removing it from your clipboard later', {
              nzDuration: 5000
            });
            drawerRef.close();
          }, error => {
            drawerRef.close();
            console.log(error);
            this.nzMessageService.error(`We couldn't sign the transaction, please check your password is correct`);
          });

      }
    });
  }

  async removeAccount(): Promise<any> {
    await this.nzModalService.confirm({
      nzTitle: 'Please read carefully',
      nzContent: `You're about to remove your account from this wallet. Make sure you have a backup of it before removing it.`,
      nzOnOk: async () => {
        const walletId = await this.walletId$.pipe(take(1)).toPromise();
        const publicKey = await this.publicKey.pipe(take(1)).toPromise();
        const accounts = await this.walletsAccountsQuery.selectAll({
          filterBy: entity => entity.publicKey === publicKey && walletId === entity.walletId,
        }).pipe(take(1))
          .toPromise();

        this.router.navigate(['/settings/wallets', walletId])
          .then(() => {
            this.walletsAccountsService.removeAccounts(accounts.map(a => a._id));
          });
      }
    });
  }

}
