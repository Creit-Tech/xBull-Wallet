import { Component, Inject, OnInit } from '@angular/core';
import { SettingsQuery } from '~root/state';
import { ENV, environment } from '~env';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  walletVersion: string = this.env.version;

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
  ) { }

  ngOnInit(): void {
  }

}
