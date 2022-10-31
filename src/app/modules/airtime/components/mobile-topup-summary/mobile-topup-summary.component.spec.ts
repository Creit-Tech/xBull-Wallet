import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileTopupSummaryComponent } from './mobile-topup-summary.component';

describe('MobileTopupSummaryComponent', () => {
  let component: MobileTopupSummaryComponent;
  let fixture: ComponentFixture<MobileTopupSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileTopupSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileTopupSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
