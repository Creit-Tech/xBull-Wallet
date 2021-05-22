import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { IWalletAsset, IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/core/wallets/state';
import { ModalsService } from '~root/shared/modals/modals.service';
import { SignRequestComponent } from '~root/shared/modals/components/sign-request/sign-request.component';
import { switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { TransactionBuilder, Operation, Asset, Account } from 'stellar-sdk';
import { merge, Subject, Subscription } from 'rxjs';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';

@Component({
  selector: 'app-add-asset',
  templateUrl: './add-asset.component.html',
  styleUrls: ['./add-asset.component.scss']
})
export class AddAssetComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  addingAsset$ = this.walletsAssetsQuery.addingAsset$;

  @Output() assetAdded: EventEmitter<void> = new EventEmitter<void>();

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
  ) { }

  ngOnInit(): void {
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
      .pipe(switchMap(selectedAccount => this.stellarSdkService.Server.loadAccount(selectedAccount._id)))
      .pipe(switchMap(loadedAccount => {
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


        return this.modalsService.open<SignRequestComponent>({
          component: SignRequestComponent,
          componentInputs: [{
            input: 'xdr',
            value: transaction.toXDR()
          }]
        });
      }))
      .pipe(take(1))
      .subscribe(modalData => {

        modalData.componentRef.instance.accepted
          .asObservable()
          .pipe(switchMap(signedXDR => this.walletsAssetsService.addAssetToAccount(signedXDR)))
          .pipe(take(1))
          .pipe(takeUntil(this.componentDestroyed$))
          .subscribe(() => {
            modalData.modalContainer.instance.onClose();
            this.assetAdded.emit();
          });

        modalData.componentRef.instance.deny
          .asObservable()
          .pipe(take(1))
          .pipe(takeUntil(this.componentDestroyed$))
          .subscribe(() => {
            modalData.modalContainer.instance.onClose();
          });

        this.addingAsset$
          .pipe(takeUntil(
            merge(
              modalData.modalContainer.instance.closeModal$,
              modalData.componentRef.instance.deny,
              this.componentDestroyed$
            )
          ))
          .subscribe(addingAssetStatus => modalData.modalContainer.instance.loading = addingAssetStatus);
      });

  }

}

interface IAddAssetForm {
  assetIssuer: string;
  assetCode: string;
  limitAmount: string;
}
