import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {DeviceAuthService} from '~root/mobile/services/device-auth.service';
import { SettingsService} from '~root/core/settings/services/settings.service';
import { ENV, environment } from '~env';
import { FormControl } from '@angular/forms';
import {SettingsQuery, WalletsQuery} from '~root/state';
import {map, switchMap, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {merge, Subject, Subscription} from 'rxjs';
import {PasswordModalComponent} from '~root/shared/modals/components/password-modal/password-modal.component';
import {NzMessageService} from 'ng-zorro-antd/message';
import {result} from "lodash";
import {CryptoService} from '~root/core/crypto/services/crypto.service';

@Component({
  selector: 'app-locking',
  templateUrl: './locking.component.html',
  styleUrls: ['./locking.component.scss']
})
export class LockingComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  mobilePlatform = this.env.platform === 'mobile';

  useDeviceAuthControl: FormControlTyped<boolean> = new FormControl(false);

  globalPasswordHash$ = this.walletsQuery.globalPasswordHash$;

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly deviceAuthService: DeviceAuthService,
    private readonly settingsService: SettingsService,
    private readonly walletsQuery: WalletsQuery,
    private readonly settingsQuery: SettingsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly cryptoService: CryptoService,
  ) { }


  passwordAuthTokenActiveStatus: Subscription = this.settingsQuery.passwordAuthTokenActive$
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(status => {
      console.log(status);
      this.useDeviceAuthControl.patchValue(status);
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async requireAuthStart(): Promise<void> {
    if (this.useDeviceAuthControl.value) {
      this.settingsService.removeDeviceAuthToken();
      this.nzMessageService.success(`Device Auth is now disabled for password protected features.`);
    } else {
      const drawerRef = this.nzDrawerService.create<PasswordModalComponent>({
        nzPlacement: 'bottom',
        nzHeight: 'auto',
        nzContent: PasswordModalComponent,
      });

      drawerRef.open();

      await drawerRef.afterOpen.pipe(take(1)).toPromise();

      const componentRef = drawerRef.getContentComponent();

      if (!componentRef) {
        return;
      }

      componentRef.password
        .pipe(take(1))
        .pipe(withLatestFrom(this.globalPasswordHash$))
        .pipe(map(([password, globalPasswordHash]) => {
          if (!globalPasswordHash) {
            throw new Error('Global password has not being defined in this wallet');
          }

          const hashedPassword = this.cryptoService.hashPassword(password);

          if (hashedPassword !== globalPasswordHash) {
            throw new Error('Password is not correct');
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
            passwordAuthToken: encryptResult.token,
            passwordAuthTokenIdentifier: encryptResult.identifier,
            passwordAuthKey: encryptResult.key,
          });
          this.nzMessageService.success(`Device Auth is now active for password protected features.`);
          drawerRef.close();
        }, error => {
          drawerRef.close();
          console.log(error);
          this.nzMessageService.error(
            error?.message || `We couldn't save your password in your device, try again or contact support`,
          );
        });
    }
  }

}
