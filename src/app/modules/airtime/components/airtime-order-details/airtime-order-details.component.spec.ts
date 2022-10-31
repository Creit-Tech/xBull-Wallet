import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirtimeOrderDetailsComponent } from './airtime-order-details.component';

describe('AirtimeOrderDetailsComponent', () => {
  let component: AirtimeOrderDetailsComponent;
  let fixture: ComponentFixture<AirtimeOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AirtimeOrderDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AirtimeOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
