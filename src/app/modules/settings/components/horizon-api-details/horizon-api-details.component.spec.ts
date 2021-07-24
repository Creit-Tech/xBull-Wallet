import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizonApiDetailsComponent } from './horizon-api-details.component';

describe('HorizonApiDetailsComponent', () => {
  let component: HorizonApiDetailsComponent;
  let fixture: ComponentFixture<HorizonApiDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HorizonApiDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HorizonApiDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
