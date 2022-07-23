import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

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

  @Input() mask = '';
  @Input() disabled = false;
  @Input() title = 'Input';
  @Input() type: 'text' | 'number' | 'password' = 'text';
  @Input() placeholder = 'Write here...';
  @Input() mode: 'dark' | 'light' = 'dark';
  @Input() iconPath?: string;

  @Output() enter: EventEmitter<InputEvent> = new EventEmitter<InputEvent>();

  value = '';

  control = new UntypedFormControl('');

  onChange: (quantity: any) => void = (quantity) => {};

  onTouched: () => void = () => {};

  ngOnInit(): void {
  }

  onInput(value: any): void {
    this.writeValue(this.control.value);
    this.onTouched();
    this.onChange(this.control.value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    if (!!value) {
      this.control.setValue(value);
      this.value = value;
    } else {
      this.value = '';
    }
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onEnter(event: any): void {
    this.enter.emit(event);
  }

}
