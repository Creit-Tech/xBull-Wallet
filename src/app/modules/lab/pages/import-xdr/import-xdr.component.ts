import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { UntypedFormControl, Validators } from '@angular/forms';
import { BehaviorSubject, merge, Subject } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-import-xdr',
  templateUrl: './import-xdr.component.html',
  styleUrls: ['./import-xdr.component.scss']
})
export class ImportXdrComponent implements OnInit {
  sendingTransaction$ = new BehaviorSubject<boolean>(false);

  componentDestroyed$: Subject<void> = new Subject<void>();
  signControl: UntypedFormControl = new UntypedFormControl('', Validators.required);
  signedControl: UntypedFormControl = new UntypedFormControl('', Validators.required);

  constructor(
    private readonly router: Router,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzMessageService: NzMessageService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  async onSign(): Promise<void> {
    if (this.signControl.invalid) {
      throw new Error(this.translateService.instant('ERROR_MESSAGES.INVALID_XDR'));
    }

    const nzRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: this.translateService.instant('COMMON_WORDS.SIGN'),
      nzContentParams: {
        xdr: this.signControl.value,
        acceptHandler: signedXdr => {
          this.signedControl.patchValue(signedXdr);
        }
      }
    });

    nzRef.open();

  }

  onBack(): void {
    this.router.navigate(['/lab']);
  }

  async onSubmit(): Promise<void> {
    if (this.signedControl.invalid) {
      return;
    }

    try {
      this.sendingTransaction$.next(true);
      await this.stellarSdkService.submitTransaction(this.signedControl.value);
      this.sendingTransaction$.next(false);
      this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));
    } catch (e) {
      this.sendingTransaction$.next(false);
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'));
    }

    this.signedControl.reset();
  }

}
