import { Component, Input, OnInit } from '@angular/core';
import { IEarnStrategy } from '~root/modules/earn/state/strategies/earn-strategy.model';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-earn-product-card',
  templateUrl: './earn-product-card.component.html',
  styleUrls: ['./earn-product-card.component.scss']
})
export class EarnProductCardComponent implements OnInit {
  earnStrategy$: ReplaySubject<IEarnStrategy> = new ReplaySubject<IEarnStrategy>();
  @Input() set earnStrategy(data: IEarnStrategy) {
    this.earnStrategy$.next(data);
  }

  constructor() { }

  ngOnInit(): void {
  }

}
