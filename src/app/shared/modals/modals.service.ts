import {
  ApplicationRef,
  Component, ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef, EmbeddedViewRef,
  Inject,
  Injectable,
  Injector,
  Renderer2,
  RendererFactory2, ViewContainerRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ModalContainerComponent } from '~root/shared/modals/modal-container/modal-container.component';
import { take } from 'rxjs/operators';

@Injectable()
export class ModalsService {
  private renderer: Renderer2;
  private modals: Array<{ id: number, component: Component }> = [];

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly rendererFactory: RendererFactory2,
    private readonly appRef: ApplicationRef,
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly injector: Injector,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }


  open<T>(data: IModalOpenServices): void {
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(ModalContainerComponent)
      .create(this.injector);

    this.appRef.attachView(componentRef.hostView);

    const rootNode = (componentRef.hostView as EmbeddedViewRef<ApplicationRef>).rootNodes[0] as HTMLElement;

    this.renderer.appendChild(this.document.body, rootNode);

    componentRef.instance.childComponent = data.component;

    componentRef.instance.closeModal$
      .pipe(take(1))
      .subscribe(() => {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
      });
  }
}

export interface IModalOpenServices {
  id?: string | number;
  component: any;
}
