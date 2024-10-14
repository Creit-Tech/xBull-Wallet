import { Component, Inject, OnInit } from '@angular/core';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { SettingsQuery } from '~root/state';
import { Sep07Service } from '~root/core/services/sep07/sep07.service';
import { ENV, environment } from '~env';

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss']
})
export class MobileMenuComponent implements OnInit {
  isMobile: boolean = this.env.platform === 'mobile';

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly sep07Service: Sep07Service,
  ) { }

  ngOnInit(): void {
  }

  closeDrawer(): void {
    this.nzDrawerRef.close();
  }

  scanSep7URI(): void {
    this.sep07Service.scanURI().then();
    this.nzDrawerRef.close();
  }
}
