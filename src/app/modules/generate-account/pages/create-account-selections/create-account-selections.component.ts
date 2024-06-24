import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { GenerateAccountService } from '../../state';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletsQuery } from '~root/state';
import { ENV, environment } from '~env';
import { GlobalsService } from '~root/lib/globals/globals.service';

@Component({
  selector: 'app-create-account-selections',
  templateUrl: './create-account-selections.component.html',
  styleUrls: ['./create-account-selections.component.scss']
})
export class CreateAccountSelectionsComponent implements OnInit {
  isThereWallet$ = this.walletsQuery.isThereWallet$;

  walletVersion = this.env.version;

  isMobilePlatform = this.env.platform === 'mobile';

  constructor(
    private readonly generateAccountService: GenerateAccountService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly walletsQuery: WalletsQuery,
    private readonly globalsService: GlobalsService,
    @Inject(ENV) private readonly env: typeof environment,
  ) { }

  ngOnInit(): void {
    this.generateAccountService.resetStore();
  }

  generateWallet(): void {
    this.generateAccountService.selectGenerateNewWalletPath();
    this.router.navigate(['generate-wallet'], {
      relativeTo: this.route
    })
      .then();
  }

  restoreWallet(): void {
    this.generateAccountService.selectRestoreWalletPath();
    this.router.navigate(['generate-password'], {
      relativeTo: this.route
    })
      .then();
  }

  importSecretKey(): void {
    this.generateAccountService.selectImportSecretKeyPath();
    this.router.navigate(['generate-password'], {
      relativeTo: this.route
    })
      .then();
  }

  async connectHardwareWallet(): Promise<void> {
    if (this.env.platform === 'website') {
      this.router.navigate(['connect-hardware-wallet'], {
        relativeTo: this.route
      })
        .then();
    } else if (this.env.platform === 'extension') {
      await this.globalsService.openWindowMode('/index.html#/create-account/connect-hardware-wallet');
      this.globalsService.window.close();
    }
  }

  connectAirGappedWallet(): void {
    this.router.navigate(['connect-air-gapped-wallet'], {
      relativeTo: this.route
    })
      .then();
  }

  connectKeyStone(): void {
    this.router.navigate(['connect-keystone'], { relativeTo: this.route }).then();
  }

}
