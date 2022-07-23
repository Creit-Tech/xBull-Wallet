import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {UntypedFormControl, Validators} from '@angular/forms';
import {SettingsService} from '~root/core/settings/services/settings.service';
import {SettingsQuery} from '~root/state';
import {map, pluck} from 'rxjs/operators';
import {NzMessageService} from "ng-zorro-antd/message";
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-anti-spam-keys',
  templateUrl: './anti-spam-keys.component.html',
  styleUrls: ['./anti-spam-keys.component.scss']
})
export class AntiSpamKeysComponent implements OnInit {
  publicKeys$ = this.settingsQuery.antiSpamPublicKeys$;

  showEmpty$: Observable<boolean> = this.publicKeys$
    .pipe(map(array => array.length === 0));

  publicKeyControl: UntypedFormControl = new UntypedFormControl('', [
    Validators.required,
    Validators.minLength(56),
    Validators.maxLength(56)
  ]);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly settingsQuery: SettingsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  onAdd(): void {
    if (this.publicKeyControl.invalid) {
      return;
    }

    try {
      this.settingsService.addPublicKeyToSpamFilter(this.publicKeyControl.value);

      this.publicKeyControl.patchValue('');
      this.cdr.detectChanges();
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.ALREADY_SAVED'), {
        nzDuration: 5000,
      });
    }
  }

  onRemove(publicKey: string): void {
    this.settingsService.removePublicKeyFromSpamFilter(publicKey);
  }

}
