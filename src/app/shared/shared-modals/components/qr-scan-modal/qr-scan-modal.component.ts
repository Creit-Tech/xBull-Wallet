import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import QrScanner from 'qr-scanner';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, Subscription } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-qr-scan-modal',
  templateUrl: './qr-scan-modal.component.html',
  styleUrls: ['./qr-scan-modal.component.scss']
})
export class QrScanModalComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  @ViewChild('qrVideo') qrVideo!: ElementRef<HTMLVideoElement>;
  qrScannerInstance!: QrScanner | null;

  @Input()
  handleQrScanned!: (text: string) => void;

  qrScanned$: Subject<{ data?: string }> = new Subject<{ data?: string }>();

  constructor() { }

  scanCompletedSubscription: Subscription = this.qrScanned$.asObservable()
    .pipe(filter(value => !!value.data && !!this.handleQrScanned))
    .pipe(take(1))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((value: any) => {
      this.handleQrScanned(value.data);
    });

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.startScanner();
  }

  ngOnDestroy(): void {
    if (this.qrScannerInstance) {
      this.qrScannerInstance.stop();
      this.qrScannerInstance.destroy();
      this.qrScannerInstance = null;
    }
  }

  async startScanner(): Promise<void> {
    this.qrScannerInstance = new QrScanner(
      this.qrVideo.nativeElement,
      result => {
        this.qrScanned$.next(result);
      },
      {
        maxScansPerSecond: 10,
        highlightScanRegion: true,
      }
    );
    await this.qrScannerInstance.start();
  }

}
