import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-hard-confirm',
  templateUrl: './hard-confirm.component.html',
  styleUrls: ['./hard-confirm.component.scss']
})
export class HardConfirmComponent {
  componentDestroyed$: ReplaySubject<void> = new ReplaySubject<void>();

  pressLoading = false;

  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  @Output() confirmed: EventEmitter<void> = new EventEmitter<void>();

  @Input() title = this.translateService.instant('HARD_CONFIRM.TITLE');
  @Input() alertMessage = this.translateService.instant('HARD_CONFIRM.ALERT_MESSAGE');

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly nzModalService: NzModalService,
    private readonly translateService: TranslateService,
  ) { }

  onConfirm(): void {
    this.nzModalService.confirm({
      nzTitle: `<b>${this.translateService.instant('HARD_CONFIRM.YOU_SURE')}</b>`,
      nzContent: this.translateService.instant('HARD_CONFIRM.DOUBLE_THINK'),
      nzOnOk: () => {
        this.confirmed.emit();
        this.nzDrawerRef.close();
      },
      nzOkText: this.translateService.instant('COMMON_WORDS.CONFIRM'),
    });
  }

  async onClose(): Promise<void> {
    this.nzDrawerRef.close();
  }
}
