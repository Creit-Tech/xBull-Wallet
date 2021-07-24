import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
  {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectComponent),
    multi: true
  }
]
})
export class SelectComponent implements OnInit {
  @Input() options: ISelectOptions[] = [];
  @Input() disabled = false;
  @Input() title = 'Input';
  @Input() placeholder = 'Select a value...';
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

export interface ISelectOptions {
  name: string;
  value: string;
}
