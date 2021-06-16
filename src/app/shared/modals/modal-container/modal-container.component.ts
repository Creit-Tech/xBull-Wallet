import {
  AfterViewInit,
  Component, ComponentFactoryResolver, ComponentRef,
  ElementRef,
  EventEmitter, Injector,
  Input, OnDestroy,
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
export class ModalContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() closeModal$: EventEmitter<void> = new EventEmitter<void>();
  @Output() createdComponent$: EventEmitter<any> = new EventEmitter<any>();

  @Input() loading = false;
  @Input() childComponent: any;
  @Input() childComponentInputs: Array<{ input: string; value: any }> = [];
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
    .pipe(delay(50)) // TODO: This is a hack to avoid doing the check of the view, let's change this in the future
    .subscribe(async () => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.childComponent);
      const component: ComponentRef<any> = this.modalContentContainer.createComponent(componentFactory);

      if (this.childComponentInputs) {
        for (const componentInput of this.childComponentInputs) {
          component.instance[componentInput.input] = componentInput.value;
        }
      }

      this.createdComponent$.next(component);
      this.showModal$.next(true);
    });

  ngOnInit(): void {
  }

  async ngOnDestroy(): Promise<void> {
    await this.onClose();
  }

  ngAfterViewInit(): void {
  }

  onShow(): void {
    this.insertComponent$.next();
  }

  async onClose(): Promise<void> {
    this.showModal$.next(false);
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.closeModal$.emit();
  }

}
