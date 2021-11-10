import { Component, OnInit } from '@angular/core';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent implements OnInit {

  constructor(
    private readonly nzDrawerRef: NzDrawerRef,
  ) { }

  ngOnInit(): void {
  }

  closeDrawer(): void {
    this.nzDrawerRef.close();
  }

}
