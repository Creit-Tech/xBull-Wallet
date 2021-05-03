import {
  ApplicationRef,
  ComponentFactoryResolver,
  EmbeddedViewRef,
  Inject,
  Injectable,
  Injector,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ToastrComponent } from '~root/shared/toastr/toastr.component';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ToastrService {
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

  open(params: IToastrParams): void {
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(ToastrComponent)
      .create(this.injector);

    this.appRef.attachView(componentRef.hostView);

    const rootNode = (componentRef.hostView as EmbeddedViewRef<ApplicationRef>).rootNodes[0] as HTMLElement;

    this.renderer.appendChild(this.document.body, rootNode);

    componentRef.instance.message = params.message || componentRef.instance.message;
    componentRef.instance.title = params.title || componentRef.instance.title;
    componentRef.instance.status = params.status || componentRef.instance.status;

    componentRef.instance.closed
      .pipe(take(1))
      .subscribe(() => {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
      });
  }
}

export interface IToastrParams {
  message: ToastrComponent['message'];
  title: ToastrComponent['title'];
  status?: ToastrComponent['status'];

}
