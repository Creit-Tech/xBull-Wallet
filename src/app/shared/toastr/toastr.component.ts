import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, of, timer } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

@Component({
  selector: 'app-toastr',
  templateUrl: './toastr.component.html',
  styleUrls: ['./toastr.component.scss']
})
export class ToastrComponent implements OnInit, AfterViewInit {
  @Input() title!: string;
  @Input() message!: string;
  @Input() status?: 'success' | 'error' = 'success';
  @Input() timer = 5000;

  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  show$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  ngOnInit(): void {
    timer(5000)
      .subscribe(() => this.onClose());
  }

  ngAfterViewInit(): void {
    of(true)
      .pipe(delay(100))
      .subscribe(() => this.show$.next(true));
  }

  onClose(): void {
    of(true)
      .pipe(tap(() => this.show$.next(false)))
      .pipe(delay(500))
      .pipe(tap(() => this.closed.emit()))
      .subscribe();
  }

}
