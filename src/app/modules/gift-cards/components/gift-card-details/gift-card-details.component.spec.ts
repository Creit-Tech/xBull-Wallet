import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftCardDetailsComponent } from './gift-card-details.component';

describe('GiftCardDetailsComponent', () => {
  let component: GiftCardDetailsComponent;
  let fixture: ComponentFixture<GiftCardDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GiftCardDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftCardDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
