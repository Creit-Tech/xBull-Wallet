import {
  AfterViewInit,
  Component, ComponentFactoryResolver,
  ElementRef,
  EventEmitter, Injector,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { delay, take } from 'rxjs/operators';

@Component({
  selector: 'app-modal-container',
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.scss']
})
export class ModalContainerComponent implements OnInit, AfterViewInit {
  @Output() closeModal$: EventEmitter<void> = new EventEmitter<void>();
  @Input() childComponent: any;
  @ViewChild('modalContentContainer', { read: ViewContainerRef }) modalContentContainer!: ViewContainerRef;

  showModal$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  insertComponent$: Subject<void> = new Subject<void>();

  constructor(
    private readonly renderer2: Renderer2,
    private readonly el: ElementRef<ModalContainerComponent>,
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly injector: Injector,
  ) { }

  insertComponentSubscription: Subscription = this.insertComponent$.asObservable()
    .pipe(take(1))
    .pipe(delay(10)) // TODO: This is a hack to avoid doing the check of the view, let's change this in the future
    .subscribe(() => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.childComponent);
      const component = this.modalContentContainer.createComponent(componentFactory);
      this.showModal$.next(true);
    });

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.insertComponent$.next();
    this.insertComponent$.complete();
  }

  async onClose(): Promise<void> {
    this.showModal$.next(false);
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.closeModal$.emit();
  }

}
