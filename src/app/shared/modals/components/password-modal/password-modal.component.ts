import {Component, EventEmitter, Input, Output} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-password-modal',
  templateUrl: './password-modal.component.html',
  styleUrls: ['./password-modal.component.scss']
})
export class PasswordModalComponent {
  passwordField: FormControl = new FormControl('', [Validators.required]);

  @Input() description = this.translateService.instant('PASSWORD_MODAL.REASON');
  @Input() handlePasswordEvent!: (password: string) => any;
  @Output() password: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly translateService: TranslateService,
  ) { }

  onConfirm(): void {
    if (this.passwordField.invalid) {
      return;
    }

    if (!!this.handlePasswordEvent) {
      this.handlePasswordEvent(this.passwordField.value);
      this.nzDrawerRef.close();
    }

    this.password.emit(this.passwordField.value);
  }

}
