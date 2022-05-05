import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {SettingsQuery} from '~root/state';
import {map} from 'rxjs/operators';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {SettingsService} from '~root/core/settings/services/settings.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-anti-spam-claimable-assets',
  templateUrl: './anti-spam-claimable-assets.component.html',
  styleUrls: ['./anti-spam-claimable-assets.component.scss']
})
export class AntiSpamClaimableAssetsComponent implements OnInit {
  claimableAssets$: Observable<Array<{ assetCode: string, assetIssuer: string }>> = this.settingsQuery
    .antiSpamClaimableAssets$
    .pipe(map((assets) => assets.map(asset => ({
      assetCode: asset.split(':')[0],
      assetIssuer: asset.split(':')[1],
    }))));

  showEmpty$: Observable<boolean> = this.claimableAssets$
    .pipe(map(array => array.length === 0));

  addAssetForm: FormGroup = new FormGroup({
    assetCode: new FormControl('', [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(12),
    ]),
    assetIssuer: new FormControl('', [
      Validators.required,
      Validators.minLength(56),
      Validators.maxLength(56)
    ])
  });

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly settingsService: SettingsService,
    private readonly nzMessageService: NzMessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  onRemove(assetCode: string, assetIssuer: string): void {
    this.settingsService.removeClaimableAssetFromSpamFilter(
      `${assetCode}:${assetIssuer}`
    );
  }

  onAdd(): void {
    if (this.addAssetForm.invalid) {
      return;
    }

    try {
      this.settingsService.addClaimableAssetToSpamFilter(
        `${this.addAssetForm.value.assetCode}:${this.addAssetForm.value.assetIssuer}`
      );

      this.addAssetForm.reset();
      this.cdr.detectChanges();
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.ALREADY_SAVED'), {
        nzDuration: 5000,
      });
    }
  }

}
