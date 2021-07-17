import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ServerApi, TransactionBuilder, Account, Operation, Asset } from 'stellar-sdk';
import OfferRecord = ServerApi.OfferRecord;
import BigNumber from 'bignumber.js';
import { WalletsAccountsQuery, WalletsOffersQuery } from '~root/state';
import { take, takeUntil } from 'rxjs/operators';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import { Subject } from 'rxjs';
import { WalletsOffersService } from '~root/core/wallets/services/wallets-offers.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SignXdrComponent } from '~root/shared/modals/components/sign-xdr/sign-xdr.component';

@Component({
  selector: 'app-offer-details',
  templateUrl: './offer-details.component.html',
  styleUrls: ['./offer-details.component.scss'],
})
export class OfferDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  @Input() offer!: OfferRecord;
  @Input() sellingAssetCode!: string;
  @Input() sellingAmount!: string;
  @Input() buyingAssetCode!: string;
  @Input() buyingAmount!: string;

  @Output() offerCancelled: EventEmitter<void> = new EventEmitter<void>();

  sendingOffer$ = this.walletsOffersQuery.sendingOffer$;

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly modalsService: ModalsService,
    private readonly walletsOffersService: WalletsOffersService,
    private readonly walletsOffersQuery: WalletsOffersQuery,
    private readonly toastrService: ToastrService,
    private readonly componentCreatorService: ComponentCreatorService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onCancel(): Promise<void> {
    const selectedAccount = await this.selectedAccount$.pipe(take(1)).toPromise();
    const loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount.publicKey);
    const transactionXDR = new TransactionBuilder(new Account(loadedAccount.accountId(), loadedAccount.sequence), {
      networkPassphrase: this.stellarSdkService.networkPassphrase,
      fee: this.stellarSdkService.fee,
    })
      .addOperation(Operation.manageSellOffer({
        amount: '0',
        offerId: this.offer.id,
        buying: this.offer.buying.asset_type === 'native'
          ? Asset.native()
          : new Asset(this.offer.buying.asset_code as string, this.offer.buying.asset_issuer),
        selling: this.offer.selling.asset_type === 'native'
          ? Asset.native()
          : new Asset(this.offer.selling.asset_code as string, this.offer.selling.asset_issuer),
        price: this.offer.price,
      }))
      .setTimeout(this.stellarSdkService.defaultTimeout)
      .build()
      .toXDR();

    const ref = await this.componentCreatorService.createOnBody<SignXdrComponent>(SignXdrComponent);

    ref.component.instance.xdr = transactionXDR;

    ref.component.instance.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((signedXdr) => {
        this.sendTransaction(signedXdr);
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.component.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.close();
      });

    ref.open();
  }

  async sendTransaction(signedXdr: string): Promise<void> {
    try {
      await this.walletsOffersService.sendManageSellOffer(signedXdr);
      this.toastrService.open({
        message: 'We removed the offer correctly',
        status: 'success',
        title: 'Operation completed'
      });
      this.offerCancelled.emit();
    } catch (e) {
      this.toastrService.open({
        message: 'We were not able to complete the operation.',
        status: 'error',
        title: 'Oops!'
      });
    }
  }

}
