import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectedSiteDetailsComponent } from './connected-site-details.component';

describe('ConnectedSiteDetailsComponent', () => {
  let component: ConnectedSiteDetailsComponent;
  let fixture: ComponentFixture<ConnectedSiteDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectedSiteDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectedSiteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
