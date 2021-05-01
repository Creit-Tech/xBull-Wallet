import { Component, Input, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-asset-item',
  templateUrl: './asset-item.component.html',
  styleUrls: ['./asset-item.component.scss']
})
export class AssetItemComponent implements OnInit {
  assetCode$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set assetCode(data: string) {
    this.assetCode$.next(data);
  }
  assetImg$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set assetImg(data: string) {
    this.assetImg$.next(data);
  }

  amount$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set amount(data: string) {
    this.amount$.next(data);
  }

  domain$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set domain(data: string) {
    this.domain$.next(data);
  }

  percentage$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set percentage(data: string) {
    this.percentage$.next(data);
  }

  constructor() { }

  ngOnInit(): void {
  }

}
