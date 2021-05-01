import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements OnInit, ControlValueAccessor {
  @Input() disabled = false;
  @Input() title = 'Input';
  @Input() type: 'text' | 'number' | 'password' = 'text';
  @Input() placeholder = 'Write here...';
  @Input() mode: 'dark' | 'light' = 'dark';
  @Input() iconPath?: string;

  value = '';

  onChange: (quantity: any) => void = (quantity) => {};

  onTouched: () => void = () => {};

  constructor() { }

  ngOnInit(): void {
  }

  onInput(value: any): void {
    this.writeValue(value);
    this.onTouched();
    this.onChange(this.value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (!!value) {
      this.value = value;
    } else {
      this.value = '';
    }
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

}
