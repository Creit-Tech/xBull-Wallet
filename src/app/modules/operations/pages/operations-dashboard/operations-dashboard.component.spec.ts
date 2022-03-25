import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationsDashboardComponent } from './operations-dashboard.component';

describe('OperationsDashboardComponent', () => {
  let component: OperationsDashboardComponent;
  let fixture: ComponentFixture<OperationsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OperationsDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
