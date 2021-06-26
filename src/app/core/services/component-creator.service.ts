import {
  ApplicationRef, ChangeDetectorRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  Inject,
  Injectable, Injector, NgZone, Renderer2,
  RendererFactory2, Type,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ComponentCreatorService {
  private renderer: Renderer2;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly rendererFactory: RendererFactory2,
    private readonly appRef: ApplicationRef,
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly injector: Injector,
    private ngZone: NgZone
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  async createOnBody<T = any>(component: Type<T>): Promise<{ component: ComponentRef<T>; open: () => void; close: () => void }> {
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(component)
      .create(this.injector);

    return {
      close: () => {
        this.ngZone.run(() => {
          this.appRef.detachView(componentRef.hostView);
          componentRef.destroy();
        });
      },
      open: () => {
        this.ngZone.run(() => {
          this.appRef.attachView(componentRef.hostView);

          const rootNode = (componentRef.hostView as EmbeddedViewRef<ApplicationRef>).rootNodes[0] as HTMLElement;

          this.renderer.appendChild(this.document.body, rootNode);
        });
      },
      component: componentRef,
    };
  }
}
