import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HardConfirmComponent } from './hard-confirm.component';

describe('HardConfirmComponent', () => {
  let component: HardConfirmComponent;
  let fixture: ComponentFixture<HardConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HardConfirmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HardConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
