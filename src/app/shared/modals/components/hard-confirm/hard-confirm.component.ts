import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-hard-confirm',
  templateUrl: './hard-confirm.component.html',
  styleUrls: ['./hard-confirm.component.scss']
})
export class HardConfirmComponent implements AfterViewInit {
  componentDestroyed$: ReplaySubject<void> = new ReplaySubject<void>();

  showModal = false;
  pressLoading = false;

  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  @Output() confirmed: EventEmitter<void> = new EventEmitter<void>();

  @Input() title = 'Confirm Process';
  @Input() alertMessage = 'Please confirm you want to processed';

  constructor() { }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }
}
