import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { pluck } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  activeIcon$: Observable<'wallet' | 'trade' | 'settings'> = this.route.data.pipe(pluck('activeIcon'));

  constructor(
    private readonly route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
  }

}
