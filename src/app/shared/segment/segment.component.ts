import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ISegmentButton {
  text: string;
  value: any;
  active?: boolean;
  routeLink?: string;
}

@Component({
  selector: 'app-segment',
  templateUrl: './segment.component.html',
  styleUrls: ['./segment.component.scss']
})
export class SegmentComponent implements OnInit, OnDestroy {
  buttons$: BehaviorSubject<ISegmentButton[]> = new BehaviorSubject<ISegmentButton[]>([]);
  @Input() set buttons(value: ISegmentButton[]) {
    this.buttons$.next(value);
  }

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.buttons$.complete();
  }

}
