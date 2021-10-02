import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {SettingsService} from '~root/core/settings/services/settings.service';
import {SettingsQuery} from '~root/state';
import {map, pluck} from 'rxjs/operators';
import {NzMessageService} from "ng-zorro-antd/message";

@Component({
  selector: 'app-anti-spam-keys',
  templateUrl: './anti-spam-keys.component.html',
  styleUrls: ['./anti-spam-keys.component.scss']
})
export class AntiSpamKeysComponent implements OnInit {
  publicKeys$ = this.settingsQuery.antiSpamPublicKeys$;

  showEmpty$: Observable<boolean> = this.publicKeys$
    .pipe(map(array => array.length === 0));

  publicKeyControl: FormControlTyped<string> = new FormControl('', [
    Validators.required,
    Validators.minLength(56),
    Validators.maxLength(56)
  ]);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly settingsQuery: SettingsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly cdr: ChangeDetectorRef
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
    } catch (e) {
      console.error(e);
      this.nzMessageService.error(`We couldn't add the key, it's possible that you already saved it.`, {
        nzDuration: 5000,
      });
    }
  }

  onRemove(publicKey: string): void {
    this.settingsService.removePublicKeyFromSpamFilter(publicKey);
  }

}
