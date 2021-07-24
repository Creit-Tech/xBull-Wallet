import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-modal-wrapper',
  templateUrl: './modal-wrapper.component.html',
  styleUrls: ['./modal-wrapper.component.scss']
})
export class ModalWrapperComponent implements OnInit, OnDestroy {
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  @Input() loading = false;

  @Input() set showModal(status: boolean) {
    this.showModal$.next(status);
  }

  showModal$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  ngOnInit(): void {
  }

  async ngOnDestroy(): Promise<void> {
    await this.onClose();
  }

  async onClose(): Promise<void> {
    this.showModal$.next(false);
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}
