import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteRequestComponent } from './site-request.component';

describe('SiteRequestComponent', () => {
  let component: SiteRequestComponent;
  let fixture: ComponentFixture<SiteRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiteRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
