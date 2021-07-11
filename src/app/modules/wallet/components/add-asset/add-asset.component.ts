import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { IWalletAsset, IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/state';
import { ModalsService } from '~root/shared/modals/modals.service';
import { switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { TransactionBuilder, Operation, Asset, Account } from 'stellar-sdk';
import { merge, Subject, Subscription } from 'rxjs';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SignXdrComponent } from '~root/shared/modals/components/sign-xdr/sign-xdr.component';

@Component({
  selector: 'app-add-asset',
  templateUrl: './add-asset.component.html',
  styleUrls: ['./add-asset.component.scss']
})
export class AddAssetComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  addingAsset$ = this.walletsAssetsQuery.addingAsset$;

  @Output() assetAdded: EventEmitter<void> = new EventEmitter<void>();
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  showModal = false;

  form: FormGroupTyped<IAddAssetForm> = new FormGroup({
    assetIssuer: new FormControl('', [
      Validators.required,
      Validators.minLength(56),
      Validators.maxLength(56),
    ]),
    assetCode: new FormControl('', [
      Validators.required,
    ]),
    limitAmount: new FormControl('', [
      Validators.pattern('^[0-9|\.]*$')
    ])
  }) as FormGroupTyped<IAddAssetForm>;

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly modalsService: ModalsService,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly componentCreatorService: ComponentCreatorService,
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.walletsAccountsQuery.getSelectedAccount$
      .pipe(take(1))
      .pipe(switchMap(selectedAccount => this.stellarSdkService.Server.loadAccount(selectedAccount.publicKey)))
      .pipe(switchMap(async loadedAccount => {
        const account = new Account(loadedAccount.accountId(), loadedAccount.sequence);
        const transaction = new TransactionBuilder(account, {
          networkPassphrase: this.stellarSdkService.networkPassphrase,
          fee: this.stellarSdkService.fee,
        })
          .addOperation(
            Operation.changeTrust({
              asset: new Asset(this.form.value.assetCode, this.form.value.assetIssuer),
              limit: !!this.form.value.limitAmount ? this.form.value.limitAmount : undefined,
            })
          )
          .setTimeout(this.stellarSdkService.defaultTimeout)
          .build();

        const ref = await this.componentCreatorService.createOnBody<SignXdrComponent>(SignXdrComponent);

        ref.component.instance.xdr = transaction.toXDR();

        return ref;
      }))
      .pipe(take(1))
      .subscribe(ref => {

        ref.component.instance.accept
          .asObservable()
          .pipe(take(1))
          .pipe(takeUntil(this.componentDestroyed$))
          .pipe(tap(async () => {
            await ref.component.instance.onClose();
            await ref.close();
          }))
          .pipe(switchMap(signedXDR => this.walletsAssetsService.addAssetToAccount(signedXDR)))
          .subscribe(() => {
            this.assetAdded.emit();
          });

        ref.component.instance.deny
          .asObservable()
          .pipe(take(1))
          .pipe(takeUntil(merge(this.componentDestroyed$, ref.destroyed$.asObservable())))
          .subscribe(() => {
            ref.component.instance.onClose()
              .then(() => ref.close());
          });

        ref.open();
      });

  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.closed.emit();
  }

}

interface IAddAssetForm {
  assetIssuer: string;
  assetCode: string;
  limitAmount: string;
}
