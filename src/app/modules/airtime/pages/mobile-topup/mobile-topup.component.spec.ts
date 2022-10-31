import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileTopupComponent } from './mobile-topup.component';

describe('MobileTopupComponent', () => {
  let component: MobileTopupComponent;
  let fixture: ComponentFixture<MobileTopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileTopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileTopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
