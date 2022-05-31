import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScamAlertIconComponent } from './scam-alert-icon.component';

describe('ScamAlertIconComponent', () => {
  let component: ScamAlertIconComponent;
  let fixture: ComponentFixture<ScamAlertIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScamAlertIconComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScamAlertIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
