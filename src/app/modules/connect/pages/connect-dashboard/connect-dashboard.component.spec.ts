import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectDashboardComponent } from './connect-dashboard.component';

describe('ConnectDashboardComponent', () => {
  let component: ConnectDashboardComponent;
  let fixture: ComponentFixture<ConnectDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
