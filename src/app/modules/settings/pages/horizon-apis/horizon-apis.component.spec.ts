import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizonApisComponent } from './horizon-apis.component';

describe('HorizonApisComponent', () => {
  let component: HorizonApisComponent;
  let fixture: ComponentFixture<HorizonApisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HorizonApisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HorizonApisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
