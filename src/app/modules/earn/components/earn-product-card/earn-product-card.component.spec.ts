import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarnProductCardComponent } from './earn-product-card.component';

describe('EarnProductCardComponent', () => {
  let component: EarnProductCardComponent;
  let fixture: ComponentFixture<EarnProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EarnProductCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EarnProductCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
