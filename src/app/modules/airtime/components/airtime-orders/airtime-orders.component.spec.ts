import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirtimeOrdersComponent } from './airtime-orders.component';

describe('AirtimeOrdersComponent', () => {
  let component: AirtimeOrdersComponent;
  let fixture: ComponentFixture<AirtimeOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AirtimeOrdersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AirtimeOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
