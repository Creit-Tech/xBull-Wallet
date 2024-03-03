import { Component, Input } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-prompt-modal',
  templateUrl: './prompt-modal.component.html',
  styleUrls: ['./prompt-modal.component.scss']
})
export class PromptModalComponent {
  controlField: UntypedFormControl = new UntypedFormControl('', [Validators.required]);

  @Input() title!: string;
  @Input() description?: string;
  @Input() handleConfirmEvent!: (value: string) => any;

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
  ) { }

  onConfirm(): void {
    if (this.controlField.invalid) {
      return;
    }

    this.handleConfirmEvent(this.controlField.value);
    this.nzDrawerRef.close();
  }
}
