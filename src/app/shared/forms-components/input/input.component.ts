import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
  @Input() disabled = false;
  @Input() title = 'Input';
  @Input() icon?: string;
  @Input() type: 'text' | 'number' | 'password' = 'text';
  @Input() placeholder = 'Write here...';

  constructor() { }

  ngOnInit(): void {
  }

}
