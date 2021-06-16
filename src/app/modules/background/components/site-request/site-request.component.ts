import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ISiteConnection } from '~root/state';

@Component({
  selector: 'app-site-request',
  templateUrl: './site-request.component.html',
  styleUrls: ['./site-request.component.scss']
})
export class SiteRequestComponent implements OnInit {
  @Output() deny: EventEmitter<void> = new EventEmitter<void>();
  @Output() accept: EventEmitter<void> = new EventEmitter<void>();

  @Input() host!: string;
  @Input() origin!: string;
  @Input() permissions!: Omit<ISiteConnection, '_id' | 'createdAt' | 'updatedAt'>;
  now: Date = new Date();

  constructor() { }

  ngOnInit(): void {
  }

  onAccept(): void {
    this.accept.emit();
  }

}
