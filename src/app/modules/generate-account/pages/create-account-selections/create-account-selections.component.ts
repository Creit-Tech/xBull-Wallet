import { Component, OnInit } from '@angular/core';
import { GenerateAccountService } from '../../state';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletsQuery } from '~root/state';

@Component({
  selector: 'app-create-account-selections',
  templateUrl: './create-account-selections.component.html',
  styleUrls: ['./create-account-selections.component.scss']
})
export class CreateAccountSelectionsComponent implements OnInit {
  isThereWallet$ = this.walletsQuery.isThereWallet$;

  constructor(
    private readonly generateAccountService: GenerateAccountService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly walletsQuery: WalletsQuery,
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

}
