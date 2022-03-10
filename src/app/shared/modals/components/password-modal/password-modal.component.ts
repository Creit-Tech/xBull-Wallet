import {Component, EventEmitter, Input, Output} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-password-modal',
  templateUrl: './password-modal.component.html',
  styleUrls: ['./password-modal.component.scss']
})
export class PasswordModalComponent {
  passwordField: FormControl = new FormControl('', [Validators.required]);

  @Input() description = 'Your password is used to decrypt your private key';
  @Output() password: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  onConfirm(): void {
    if (this.passwordField.invalid) {
      return;
    }
    this.password.emit(this.passwordField.value);
  }

}
