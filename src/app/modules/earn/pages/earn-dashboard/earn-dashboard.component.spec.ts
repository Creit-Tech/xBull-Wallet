import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarnDashboardComponent } from './earn-dashboard.component';

describe('EarnDashboardComponent', () => {
  let component: EarnDashboardComponent;
  let fixture: ComponentFixture<EarnDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EarnDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EarnDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
