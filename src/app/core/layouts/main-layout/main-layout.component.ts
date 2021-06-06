import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { pluck } from 'rxjs/operators';
import { SettingsQuery } from '~root/state/settings.query';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  activeIcon$: Observable<'wallet' | 'trade' | 'settings' | 'lab'> = this.route.data.pipe(pluck('activeIcon'));

  advanceMode$ = this.settingsQuery.advanceMode$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly settingsQuery: SettingsQuery,
  ) { }

  ngOnInit(): void {
  }

}
