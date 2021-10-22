import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-password-modal',
  templateUrl: './password-modal.component.html',
  styleUrls: ['./password-modal.component.scss']
})
export class PasswordModalComponent {
  passwordField: FormControlTyped<string> = new FormControl('', [Validators.required]);

  @Output() password: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  onConfirm(): void {
    if (this.passwordField.invalid) {
      return;
    }
    this.password.emit(this.passwordField.value);
  }

}
