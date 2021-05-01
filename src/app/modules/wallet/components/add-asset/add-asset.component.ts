import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-asset',
  templateUrl: './add-asset.component.html',
  styleUrls: ['./add-asset.component.scss']
})
export class AddAssetComponent implements OnInit {
  form = new FormGroup({
    keyIssuer: new FormControl('', [
      Validators.required,
      Validators.minLength(56),
      Validators.maxLength(56),
    ]),
    assetCode: new FormControl('', [
      Validators.required,
    ]),
    limitAmount: new FormControl('', [
      Validators.required,
    ])
  });

  constructor() { }

  ngOnInit(): void {
  }

}
