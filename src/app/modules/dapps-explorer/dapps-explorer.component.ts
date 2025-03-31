import { Component } from '@angular/core';
import { NzInputDirective, NzInputGroupComponent } from 'ng-zorro-antd/input';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { BrowserService } from '~root/core/services/browser/browser.service';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { NzDividerComponent } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-dapps-explorer',
  standalone: true,
  imports: [
    NzInputGroupComponent,
    NzInputDirective,
    NzButtonComponent,
    NzCardComponent,
    AsyncPipe,
    NzDividerComponent
  ],
  templateUrl: './dapps-explorer.component.html',
  styleUrl: './dapps-explorer.component.scss',
})
export class DappsExplorerComponent {
  dapps$: BehaviorSubject<{ url: string; name: string; image: string; description: string }[]> = new BehaviorSubject([
    {
      "url": "https://mainnet.blend.capital/",
      "name": "Blend Capital",
      "image": "https://mainnet.blend.capital/icons/blend_logo.svg",
      "description": "Decentralized lending pools created by users, DAOs, and institutions."
    },
    {
      "url": "https://swap.xbull.app/",
      "name": "xBull Swap",
      "image": "https://stellar.creit.tech/wallet-icons/xbull.png",
      "description": "Get the best rate across all the Soroban AMMs"
    },
    {
      "url": "https://app.sorobandomains.org",
      "name": "Soroban Domains",
      "image": "https://app.sorobandomains.org/assets/logo/logo-for-dark-background.png",
      "description": "Register your own .xlm domain"
    },
    {
      "url": "https://app.fxdao.io",
      "name": "FxDAO",
      "image": "https://assets.fxdao.io/brand/FxDAO-logo.png",
      "description": "The first decentralized stablecoins on Soroban"
    },
  ]);

  constructor(
    private readonly browserService: BrowserService,
  ) {}

  search(value: string) {
    value = value.replace('http://', '');
    if (!value.includes('://')) {
      value = 'https://' + value;
    }

    this.browserService.open(value)
  }
}
