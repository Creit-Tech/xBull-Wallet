import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportWalletComponent } from './export-wallet.component';

describe('ExportWalletComponent', () => {
  let component: ExportWalletComponent;
  let fixture: ComponentFixture<ExportWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
