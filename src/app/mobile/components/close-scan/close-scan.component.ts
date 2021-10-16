import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {QrScannerService} from '~root/mobile/services/qr-scanner.service';

@Component({
  selector: 'app-close-scan',
  templateUrl: './close-scan.component.html',
  styleUrls: ['./close-scan.component.scss']
})
export class CloseScanComponent implements OnInit {
  constructor(
    private readonly qrScannerService: QrScannerService,
  ) { }

  ngOnInit(): void {
  }

  onClose(): void {
    this.qrScannerService.closeEvent$.next();
  }

}
