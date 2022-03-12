import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-layout-v1',
  templateUrl: './main-layout-v1.component.html',
  styleUrls: ['./main-layout-v1.component.scss']
})
export class MainLayoutV1Component implements OnInit {
  isCollapsed = true;

  constructor() { }

  ngOnInit(): void {
  }

}
