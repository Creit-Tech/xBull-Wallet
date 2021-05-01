import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-send-funds',
  templateUrl: './send-funds.component.html',
  styleUrls: ['./send-funds.component.scss']
})
export class SendFundsComponent implements OnInit {
  form = new FormGroup({
    publicKey: new FormControl('', [
      Validators.required,
      Validators.minLength(56),
      Validators.maxLength(56),
    ]),
    memo: new FormControl(''),
    assetCode: new FormControl('', [Validators.required]),
    amount: new FormControl('', [Validators.required])
  });

  constructor() { }

  ngOnInit(): void {
  }

}
