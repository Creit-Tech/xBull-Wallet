import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-connect-no-wallet',
  templateUrl: './connect-no-wallet.component.html',
  styleUrls: ['./connect-no-wallet.component.scss']
})
export class ConnectNoWalletComponent implements OnInit {

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
  }

  retryProcess(): void {
    this.router.navigate(['/connect'], {
      queryParams: this.route.snapshot.queryParams
    });
  }

}
