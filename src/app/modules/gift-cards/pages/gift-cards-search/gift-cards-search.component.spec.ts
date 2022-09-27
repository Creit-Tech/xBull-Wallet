import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftCardsSearchComponent } from './gift-cards-search.component';

describe('GiftCardsSearchComponent', () => {
  let component: GiftCardsSearchComponent;
  let fixture: ComponentFixture<GiftCardsSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GiftCardsSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftCardsSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
