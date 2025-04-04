import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DeviceAuthService } from '~root/mobile/services/device-auth.service';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { ENV, environment } from '~env';
import { UntypedFormControl } from '@angular/forms';
import { SettingsQuery, WalletsQuery } from '~root/state';
import { map, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {merge, Subject, Subscription} from 'rxjs';
import { PasswordModalComponent } from '~root/shared/shared-modals/components/password-modal/password-modal.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { TranslateService } from '@ngx-translate/core';
import { WalletsService } from '~root/core/wallets/services/wallets.service';

@Component({
  selector: 'app-locking',
  templateUrl: './locking.component.html',
  styleUrls: ['./locking.component.scss']
})
export class LockingComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  mobilePlatform = this.env.platform === 'mobile';

  useDeviceAuthControl: UntypedFormControl = new UntypedFormControl(false);
  keepPasswordControl: UntypedFormControl = new UntypedFormControl(false);
  timeoutMinutesControl: UntypedFormControl = new UntypedFormControl('');

  keepPasswordActive$ = this.settingsQuery.keepPasswordActive$;

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly deviceAuthService: DeviceAuthService,
    private readonly settingsService: SettingsService,
    private readonly settingsQuery: SettingsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly cryptoService: CryptoService,
    private readonly translateService: TranslateService,
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsService: WalletsService,
  ) { }

  passwordAuthTokenActiveStatus: Subscription = this.settingsQuery.passwordAuthTokenActive$
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(status => {
      this.useDeviceAuthControl.patchValue(status);
    });

  keepPasswordActiveStatus: Subscription = this.settingsQuery.keepPasswordActive$
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(status => {
      this.keepPasswordControl.patchValue(status);
    });

  timeoutControlUpdatesSubscription: Subscription = this.timeoutMinutesControl
    .valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(value => {
      this.settingsService.setKeptPasswordTimeout(value);
      this.nzMessageService.success(this.translateService.instant('SETTINGS.LOCKING.TIMEOUT_UPDATED', { value }));
    });

  ngOnInit(): void {
    this.settingsQuery.timeoutPasswordSaved$
      .pipe(take(1))
      .subscribe(value => {
        this.timeoutMinutesControl.setValue(value, { emitEvent: false });
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async requireAuthStart(): Promise<void> {
    if (this.useDeviceAuthControl.value) {
      this.settingsService.removeDeviceAuthToken();
      this.nzMessageService.success(this.translateService.instant('SETTINGS.LOCKING.DEVICE_AUTH_DISABLED'));
    } else {
      const drawerRef = this.nzDrawerService.create<PasswordModalComponent>({
        nzPlacement: 'bottom',
        nzHeight: 'auto',
        nzContent: PasswordModalComponent,
        nzWrapClassName: 'ios-safe-y'
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
          if (!this.walletsQuery.getValue().passwordSet) {
            throw new Error(this.translateService.instant('ERROR_MESSAGES.PASSWORD_NOT_SET'));
          }

          if (!this.walletsService.validatePassword(password)) {
            throw new Error(this.translateService.instant('ERROR_MESSAGES.PASSWORD_INCORRECT'));
          }

          return password;
        }))
        .pipe(switchMap(password => {
          return this.deviceAuthService.encryptWithDevice(password);
        }))
        .pipe(takeUntil(merge(
          this.componentDestroyed$,
          drawerRef.afterClose
        )))
        .subscribe(encryptResult => {
          this.settingsService.addDeviceAuthToken({
            passwordAuthTokenIdentifier: encryptResult.identifier,
            passwordAuthKey: encryptResult.key,
          });
          this.nzMessageService.success(this.translateService.instant('SETTINGS.LOCKING.DEVICE_AUTH_ENABLED'));
          drawerRef.close();
        }, error => {
          drawerRef.close();
          console.log(error);
          this.nzMessageService.error(
            error?.message || this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'),
          );
        });
    }
  }

  async keepPasswordStart(): Promise<void> {
    if (this.keepPasswordControl.value) {
      this.settingsService.disableKeepPasswordOption();
      this.nzMessageService.success(this.translateService.instant('SETTINGS.LOCKING.KEEP_PASSWORD_DISABLED'));
    } else {
      if (!this.walletsQuery.getValue().passwordSet) {
        return;
      }
      const drawerRef = this.nzDrawerService.create<PasswordModalComponent>({
        nzPlacement: 'bottom',
        nzHeight: 'auto',
        nzContent: PasswordModalComponent,
        nzWrapClassName: 'ios-safe-y',
        nzContentParams: {
          handlePasswordEvent: password => {
            if (!this.walletsService.validatePassword(password)) {
              this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.PASSWORD_INCORRECT'));
              return;
            }

            this.settingsService.setKeptPassword(password);

            this.settingsService.enableKeepPasswordOption();
            this.nzMessageService.success(this.translateService.instant('SETTINGS.LOCKING.KEEP_PASSWORD_ENABLED'));
          }
        }
      });

      drawerRef.open();
    }
  }

}
