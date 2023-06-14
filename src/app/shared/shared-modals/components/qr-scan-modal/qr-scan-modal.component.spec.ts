import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrScanModalComponent } from './qr-scan-modal.component';

describe('QrScanModalComponent', () => {
  let component: QrScanModalComponent;
  let fixture: ComponentFixture<QrScanModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QrScanModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QrScanModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
