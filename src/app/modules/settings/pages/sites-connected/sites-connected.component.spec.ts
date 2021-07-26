import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitesConnectedComponent } from './sites-connected.component';

describe('SitesConnectedComponent', () => {
  let component: SitesConnectedComponent;
  let fixture: ComponentFixture<SitesConnectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SitesConnectedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SitesConnectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
