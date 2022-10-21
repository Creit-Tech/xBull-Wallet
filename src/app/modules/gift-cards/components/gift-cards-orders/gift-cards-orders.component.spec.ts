import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftCardsOrdersComponent } from './gift-cards-orders.component';

describe('GiftCardsOrdersComponent', () => {
  let component: GiftCardsOrdersComponent;
  let fixture: ComponentFixture<GiftCardsOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GiftCardsOrdersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftCardsOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
