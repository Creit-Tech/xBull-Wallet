import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseScanComponent } from './close-scan.component';

describe('CloseScanComponent', () => {
  let component: CloseScanComponent;
  let fixture: ComponentFixture<CloseScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CloseScanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
