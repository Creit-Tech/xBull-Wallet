import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'xBull - Wallet';

  ngAfterViewInit(): void {
    chrome
      .runtime
      .sendMessage({ command: 'fetch' }, response => {
        console.log(response);
      });
  }
}
