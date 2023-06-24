import { Component, OnInit } from '@angular/core';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { SettingsQuery } from '~root/state';
import { Sep07Service } from '~root/core/services/sep07/sep07.service';

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss']
})
export class MobileMenuComponent implements OnInit {
  advanceMode$ = this.settingsQuery.advanceMode$;

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly settingsQuery: SettingsQuery,
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
