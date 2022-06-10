import { Component, OnInit } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-strategy-details',
  templateUrl: './strategy-details.component.html',
  styleUrls: ['./strategy-details.component.scss']
})
export class StrategyDetailsComponent implements OnInit {
  results = [{
    name: 'Trinidad and Tobago',
    series: [
      {
        value: 3243,
        name: new Date('2016-09-15T13:39:11.535Z')
      },
      {
        value: 3648,
        name: new Date('2016-09-16T00:34:52.961Z')
      },
      {
        value: 2140,
        name: new Date('2016-09-16T13:57:37.378Z')
      },
      {
        value: 6879,
        name: new Date('2016-09-19T18:25:03.489Z')
      },
      {
        value: 4775,
        name: new Date('2016-09-20T03:32:21.568Z')
      },
      {
        value: 4235,
        name: new Date('2016-09-21T03:32:21.568Z')
      },
      {
        value: 3235,
        name: new Date('2016-09-22T03:32:21.568Z')
      },
      {
        value: 2155,
        name: new Date('2016-09-23T03:32:21.568Z')
      },
      {
        value: 1230,
        name: new Date('2016-09-24T03:32:21.568Z')
      },
    ]
  }];

  graphColors: Color = {
    name: 'xbull',
    selectable: true,
    domain: ['#C19CFC', '#9977D3', '#7354AC', '#4E3286', '#281262'],
    group: ScaleType.Linear,
  };

  constructor() { }

  ngOnInit(): void {
  }

}
