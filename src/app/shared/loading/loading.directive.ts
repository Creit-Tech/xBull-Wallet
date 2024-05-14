import {
  AfterViewInit,
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef, EmbeddedViewRef,
  Input,
  OnDestroy,
  Renderer2, TemplateRef,
  ViewContainerRef,
  ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PulseLoadingComponent } from '~root/shared/loading/pulse-loading/pulse-loading.component';

@Directive({
  selector: '[appLoading]'
})
export class LoadingDirective implements AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  appLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  @Input() set appLoading(status: boolean | null) {
    this.appLoading$.next(status || false);
  }

  // Todo: In the future maybe we could make this dinamyc IE use multiple kinds of loading
  loadingComponentRef!: ComponentRef<PulseLoadingComponent>;
  rootNode!: HTMLElement;

  constructor(
    private readonly el: ElementRef,
    private readonly vcr: ViewContainerRef,
    private readonly renderer: Renderer2,
    private readonly componentFactoryResolver: ComponentFactoryResolver,
  ) { }

  appLoadingSubscription: Subscription = this.appLoading$
    .pipe(takeUntil(this.componentDestroyed$))
    .pipe(filter(status => !(!status && !this.loadingComponentRef)))
    .subscribe((status) => {
      if (!!status) {
        this.loadingComponentRef = this.componentFactoryResolver.resolveComponentFactory(PulseLoadingComponent)
          .create(this.vcr.injector);

        this.rootNode = (this.loadingComponentRef.hostView as EmbeddedViewRef<ApplicationRef>).rootNodes[0] as HTMLElement;

        this.renderer.appendChild(this.el.nativeElement, this.rootNode);
      } else {
        this.renderer.removeChild(this.el.nativeElement, this.rootNode);
        this.loadingComponentRef.destroy();
      }
    });

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

}
