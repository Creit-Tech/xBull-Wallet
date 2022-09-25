import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftCardOrderDetailsComponent } from './gift-card-order-details.component';

describe('GiftCardOrderDetailsComponent', () => {
  let component: GiftCardOrderDetailsComponent;
  let fixture: ComponentFixture<GiftCardOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GiftCardOrderDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftCardOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
