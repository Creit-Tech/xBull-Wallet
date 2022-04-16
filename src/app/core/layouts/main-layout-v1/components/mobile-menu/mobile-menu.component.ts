import { Component, OnInit } from '@angular/core';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { SettingsQuery } from '~root/state';

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
  ) { }

  ngOnInit(): void {
  }

  closeDrawer(): void {
    this.nzDrawerRef.close();
  }
}
