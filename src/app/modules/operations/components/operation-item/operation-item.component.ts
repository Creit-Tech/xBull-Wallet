import { Component, Input, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { IWalletsOperation } from '~root/state';

@Component({
  selector: 'app-operation-item',
  templateUrl: './operation-item.component.html',
  styleUrls: ['./operation-item.component.scss']
})
export class OperationItemComponent implements OnInit {
  operation$: ReplaySubject<IWalletsOperation> = new ReplaySubject<IWalletsOperation>();
  @Input() set operation(data: IWalletsOperation) {
    this.operation$.next(data);
  }

  constructor() { }

  ngOnInit(): void {
  }

}
