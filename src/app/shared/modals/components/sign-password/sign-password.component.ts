// Deprecated, use password-modal instead

import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-sign-password',
  templateUrl: './sign-password.component.html',
  styleUrls: ['./sign-password.component.scss']
})
export class SignPasswordComponent implements AfterViewInit {
  passwordField: UntypedFormControl = new UntypedFormControl('', [Validators.required]);

  showModal = false;
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() password: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }
  onConfirm(): void {
    if (this.passwordField.invalid) {
      return;
    }
    this.password.emit(this.passwordField.value);
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.cancel.emit();
  }

}
