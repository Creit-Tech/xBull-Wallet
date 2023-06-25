import { Component, OnInit } from '@angular/core';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { MobileMenuComponent } from '~root/core/layouts/main-layout-v1/components/mobile-menu/mobile-menu.component';
import {
  LayoutV1AccountHorizonSelectorComponent
} from '~root/core/layouts/main-layout-v1/components/layout-v1-account-horizon-selector/layout-v1-account-horizon-selector.component';
import { HorizonApisQuery, WalletsAccountsQuery } from '~root/state';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Sep07Service } from '~root/core/services/sep07/sep07.service';

@Component({
  selector: 'app-layout-v1-header',
  templateUrl: './layout-v1-header.component.html',
  styleUrls: ['./layout-v1-header.component.scss']
})
export class LayoutV1HeaderComponent implements OnInit {
  selectedPublicKey$: Observable<string> = this.walletsAccountsQuery.getSelectedAccount$
    .pipe(map(selectedAccount => selectedAccount.publicKey));

  selectedHorizonApiName$: Observable<string> = this.horizonApisQuery.getSelectedHorizonApi$
    .pipe(map(horizonApi => horizonApi.name));

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
    private readonly sep07Service: Sep07Service,
  ) { }

  ngOnInit(): void {
  }

  openAccountHorizonSelector(): void {
    this.nzDrawerService.create<LayoutV1AccountHorizonSelectorComponent>({
      nzContent: LayoutV1AccountHorizonSelectorComponent,
      nzTitle: this.translateService.instant('MAIN_LAYOUT.ACCOUNT_AND_HORIZON_TITLE'),
      nzPlacement: 'right',
      nzCloseOnNavigation: true,
      nzWrapClassName: 'ios-safe-y',
      nzBodyStyle: {
        padding: '0'
      }
    });
  }

  openMenu(): void {
    this.nzDrawerService.create<MobileMenuComponent>({
      nzContent: MobileMenuComponent,
      nzTitle: this.translateService.instant('MAIN_LAYOUT.NAVIGATION_TITLE'),
      nzPlacement: 'right',
      nzCloseOnNavigation: true,
      nzWrapClassName: 'ios-safe-y',
      nzBodyStyle: {
        padding: '0'
      }
    });
  }

  scanSep7URI(): void {
    this.sep07Service.scanURI()
      .then();
  }

}
