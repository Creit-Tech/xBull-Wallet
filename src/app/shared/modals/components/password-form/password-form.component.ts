// @@ Deprecated

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-password-form',
  templateUrl: './password-form.component.html',
  styleUrls: ['./password-form.component.scss']
})
export class PasswordFormComponent implements OnInit {
  @Output() password: EventEmitter<string> = new EventEmitter<string>();

  passwordField: FormControlTyped<string> = new FormControl('', [Validators.required]);

  constructor() { }

  ngOnInit(): void {
  }

  onConfirm(): void {
    if (this.passwordField.invalid) {
      return;
    }
    this.password.emit(this.passwordField.value);
  }

}
