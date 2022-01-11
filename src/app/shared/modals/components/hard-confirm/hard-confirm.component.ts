import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';

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

  @Input() title = 'Confirm Process';
  @Input() alertMessage = 'Please confirm you want to processed';

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly nzModalService: NzModalService,
  ) { }

  onConfirm(): void {
    this.nzModalService.confirm({
      nzTitle: '<b>Are you sure about this?</b>',
      nzContent: `Double check before confirming this action, if you're sure about this click the confirm button`,
      nzOnOk: () => {
        this.confirmed.emit();
        this.nzDrawerRef.close();
      },
      nzOkText: 'Confirm'
    });
  }

  async onClose(): Promise<void> {
    this.nzDrawerRef.close();
  }
}
