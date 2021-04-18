import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss']
})
export class TextareaComponent implements OnInit {
  @Input() disabled = false;
  @Input() title = 'Textarea';

  constructor() { }

  ngOnInit(): void {
  }

}
