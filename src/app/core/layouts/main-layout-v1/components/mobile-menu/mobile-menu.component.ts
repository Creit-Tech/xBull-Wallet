import { Component, OnInit } from '@angular/core';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss']
})
export class MobileMenuComponent implements OnInit {

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
  ) { }

  ngOnInit(): void {
  }

  closeDrawer(): void {
    this.nzDrawerRef.close();
  }
}
