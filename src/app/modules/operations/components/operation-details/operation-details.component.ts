import { Component, Input, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { Networks } from '@stellar/stellar-sdk';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { HorizonApisQuery, IWalletsOperation } from '~root/state';
import { GlobalsService } from '~root/lib/globals/globals.service';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';

@Component({
  selector: 'app-operation-details',
  templateUrl: './operation-details.component.html',
  styleUrls: ['./operation-details.component.scss']
})
export class OperationDetailsComponent implements OnInit {
  operation$: ReplaySubject<any> = new ReplaySubject<any>();
  @Input() set operation(data: IWalletsOperation) {
    this.operation$.next(data);
  }

  constructor(
    private readonly globalsService: GlobalsService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly horizonApisService: HorizonApisService,
  ) { }

  ngOnInit(): void {
  }

  async checkOnBlockchain(): Promise<void> {
    const selectedHorizonApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);

    const operation = await firstValueFrom(this.operation$);

    const url = new URL(selectedHorizonApi.url);
    url.pathname = `operations/${operation.operationRecord.id}`;

    // TODO: This needs to be dynamic
    this.globalsService.window.open(url.href, '_blank');
  }

}
