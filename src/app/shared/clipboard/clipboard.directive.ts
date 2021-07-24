import { Directive, EventEmitter, HostListener, Inject, Input, Output, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ToastrService } from '~root/shared/toastr/toastr.service';

@Directive({
  selector: '[appClipboard]'
})
export class ClipboardDirective {
  private renderer: Renderer2;
  @Input() textToCopy?: string | null;
  @Output() copied: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private readonly rendererFactory2: RendererFactory2,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly toastrService: ToastrService,
  ) {
    this.renderer = this.rendererFactory2.createRenderer(null, null);
  }

  @HostListener('click')
  copyToClipboard(): void {
    if (!this.textToCopy) {
      return;
    }

    try {
      const el = this.renderer.createElement('input');
      this.renderer.setAttribute(el, 'readonly', '');
      this.renderer.setAttribute(el, 'value', this.textToCopy);
      this.renderer.setStyle(el, 'position', 'absolute');
      this.renderer.setStyle(el, 'left', '-9999px');
      this.renderer.appendChild(this.document.body, el);
      this.renderer.selectRootElement(el);
      el.select();
      el.setSelectionRange(0, 99999);
      this.document.execCommand('copy');
      this.renderer.removeChild(this.document.body, el);

      this.copied.emit(this.textToCopy);

      this.toastrService.open({
        status: 'success',
        title: 'Copy completed',
        message: 'Text copied to the clipboard'
      });
    } catch (e) {
      this.toastrService.open({
        status: 'error',
        title: 'Oops!',
        message: `We couldn't copy the text`
      });
    }
  }

}
