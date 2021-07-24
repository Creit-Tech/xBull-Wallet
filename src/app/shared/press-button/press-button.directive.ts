import { AfterViewInit, Directive, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';
import { BehaviorSubject, merge, ReplaySubject, Subject, timer } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';

@Directive({
  selector: '[appPressButton]'
})
export class PressButtonDirective implements AfterViewInit, OnDestroy {
  componentDestroyed$: ReplaySubject<void> = new ReplaySubject<void>();

  @Output() started: EventEmitter<void> = new EventEmitter<void>();
  @Output() completed: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancelled: EventEmitter<void> = new EventEmitter<void>();

  mouseUp$: Subject<void> = new Subject<void>();
  mouseDown$: Subject<void> = new Subject<void>();

  @Input() secondsToFinish = 1;

  constructor() { }

  ngAfterViewInit(): void {
    this.mouseDown$.asObservable()
      .pipe(switchMap(() => {
        return timer(0, 1000)
          .pipe(takeUntil(merge(this.mouseUp$, this.completed)));
      }))
      .pipe(filter(value => value >= this.secondsToFinish))
      .subscribe(() => {
        this.completed.emit();
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    this.mouseUp$.next();
    this.cancelled.next();
  }

  @HostListener('mousedown')
  onMouseDown(): void {
    this.mouseDown$.next();
    this.started.next();
  }

}
