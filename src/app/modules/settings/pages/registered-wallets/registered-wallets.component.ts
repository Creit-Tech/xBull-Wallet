import { Component, OnInit } from '@angular/core';
import { WalletsQuery } from '~root/state';

@Component({
  selector: 'app-registered-wallets',
  templateUrl: './registered-wallets.component.html',
  styleUrls: ['./registered-wallets.component.scss']
})
export class RegisteredWalletsComponent implements OnInit {
  allWallets$ = this.walletsQuery.selectAll();

  constructor(
    private readonly walletsQuery: WalletsQuery,
  ) { }

  ngOnInit(): void {
  }

}
