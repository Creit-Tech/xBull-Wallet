import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  Inject,
  Injectable,
  Injector,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ModalContainerComponent } from '~root/shared/modals/modal-container/modal-container.component';
import { take } from 'rxjs/operators';

@Injectable()
export class ModalsService {
  private renderer: Renderer2;

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

  async open<T = any>(data: IModalOpenParams): Promise<IModalOpenReturns<T>> {
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(ModalContainerComponent)
      .create(this.injector);

    componentRef.instance.childComponent = data.component;

    if (!!data.componentInputs) {
      componentRef.instance.childComponentInputs = data.componentInputs;
    }

    this.appRef.attachView(componentRef.hostView);

    const rootNode = (componentRef.hostView as EmbeddedViewRef<ApplicationRef>).rootNodes[0] as HTMLElement;

    this.renderer.appendChild(this.document.body, rootNode);

    componentRef.instance.closeModal$
      .pipe(take(1))
      .subscribe(() => {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
      });

    return componentRef.instance.createdComponent$
      .pipe(take(1))
      .toPromise()
      .then(childComponentRef => ({
        modalContainer: componentRef,
        componentRef: childComponentRef
      }));
  }
}

export interface IModalOpenParams {
  id?: string | number;
  component: any;
  componentInputs?: Array<{
    input: string;
    value: any;
  }>;
}

export interface IModalOpenReturns<T> {
  modalContainer: ComponentRef<ModalContainerComponent>;
  componentRef: ComponentRef<T>;
}
