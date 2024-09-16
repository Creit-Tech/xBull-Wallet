import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ISiteConnection } from '~root/state';

@Component({
  selector: 'app-site-request',
  templateUrl: './site-request.component.html',
  styleUrls: ['./site-request.component.scss']
})
export class SiteRequestComponent {
  @Input() deny!: () => void;
  @Input() accept!: () => void;

  @Input() host!: string;
  @Input() origin!: string;
  @Input() permissions!: Pick<ISiteConnection, 'canRequestSign' | 'canRequestPublicKey'>;
  now: Date = new Date();

  constructor() { }

  onAccept(): void {
    this.accept();
  }

  async onClose(): Promise<void> {
    this.deny();
  }

}
