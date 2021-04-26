import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-select-and-input',
  templateUrl: './select-and-input.component.html',
  styleUrls: ['./select-and-input.component.scss']
})
export class SelectAndInputComponent implements OnInit {
  @Input() mode: 'dark' | 'light' = 'dark';

  constructor() { }

  ngOnInit(): void {
  }

}
