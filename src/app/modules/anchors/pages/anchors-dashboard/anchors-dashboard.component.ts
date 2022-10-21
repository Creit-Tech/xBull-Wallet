import { Component, OnInit } from '@angular/core';
import { HorizonApisQuery } from '~root/state';
import { AnchorsQuery } from '~root/modules/anchors/state/anchors.query';
import { distinctUntilKeyChanged, switchMap } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AddAnchorModalComponent } from '~root/modules/anchors/components/add-anchor-modal/add-anchor-modal.component';

@Component({
  selector: 'app-anchors-dashboard',
  templateUrl: './anchors-dashboard.component.html',
  styleUrls: ['./anchors-dashboard.component.scss']
})
export class AnchorsDashboardComponent implements OnInit {
  selectedHorizonApi$ = this.horizonApisQuery.getSelectedHorizonApi$;
  networkAnchors$ = this.selectedHorizonApi$
    .pipe(distinctUntilKeyChanged('networkPassphrase'))
    .pipe(switchMap(horizonApi => {
      return this.anchorsQuery.selectAll({
        filterBy: entity => entity.networkPassphrase === horizonApi?.networkPassphrase
      });
    }));

  constructor(
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly anchorsQuery: AnchorsQuery,
    private readonly nzModalService: NzModalService,
  ) { }

  ngOnInit(): void {
  }

  addNewAnchor(): void {
    this.nzModalService.create<AddAnchorModalComponent>({
      nzContent: AddAnchorModalComponent,
      nzFooter: null,
    });
  }

}
