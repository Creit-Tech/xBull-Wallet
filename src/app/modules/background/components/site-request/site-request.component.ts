import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ISiteConnection } from '~root/state';

@Component({
  selector: 'app-site-request',
  templateUrl: './site-request.component.html',
  styleUrls: ['./site-request.component.scss']
})
export class SiteRequestComponent implements OnInit, AfterViewInit {
  showModal = false;
  @Output() deny: EventEmitter<void> = new EventEmitter<void>();
  @Output() accept: EventEmitter<void> = new EventEmitter<void>();

  @Input() host!: string;
  @Input() origin!: string;
  @Input() permissions!: Omit<ISiteConnection, '_id' | 'createdAt' | 'updatedAt'>;
  now: Date = new Date();

  constructor() { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  onAccept(): void {
    this.accept.emit();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.deny.emit();
  }

}
