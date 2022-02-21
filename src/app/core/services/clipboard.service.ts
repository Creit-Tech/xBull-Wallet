import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private renderer: Renderer2;

  constructor(
    private readonly rendererFactory2: RendererFactory2,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    this.renderer = this.rendererFactory2.createRenderer(null, null);
  }

  copyToClipboard(textToCopy: string): string {
    if (!textToCopy) {
      throw new Error(`Text to copy to the clipboard can't be undefined`);
    }

    const el = this.renderer.createElement('input');
    this.renderer.setAttribute(el, 'readonly', '');
    this.renderer.setAttribute(el, 'value', textToCopy);
    this.renderer.setStyle(el, 'position', 'absolute');
    this.renderer.setStyle(el, 'left', '-9999px');
    this.renderer.appendChild(this.document.body, el);
    this.renderer.selectRootElement(el);
    el.select();
    el.setSelectionRange(0, 99999);
    this.document.execCommand('copy');
    this.renderer.removeChild(this.document.body, el);

    return textToCopy;
  }
}
