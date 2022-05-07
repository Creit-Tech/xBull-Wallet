import { Directive, EventEmitter, HostListener, Inject, Input, Output, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ClipboardService } from '~root/core/services/clipboard.service';
import { TranslateService } from '@ngx-translate/core';

@Directive({
  selector: '[appClipboard]'
})
export class ClipboardDirective {
  @Input() textToCopy?: string | null;
  @Output() copied: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private readonly nzMessageService: NzMessageService,
    private readonly clipboardService: ClipboardService,
    private readonly translateService: TranslateService,
  ) {}

  @HostListener('click')
  copyToClipboard(): void {
    if (!this.textToCopy) {
      return;
    }

    try {
      this.clipboardService.copyToClipboard(this.textToCopy);
      this.copied.emit(this.textToCopy);

      this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.COPIED_TO_CLIPBOARD'));
    } catch (e: any) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
    }
  }

}
