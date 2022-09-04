import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnchorsDashboardComponent } from './anchors-dashboard.component';

describe('AnchorsDashboardComponent', () => {
  let component: AnchorsDashboardComponent;
  let fixture: ComponentFixture<AnchorsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnchorsDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnchorsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
