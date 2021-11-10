import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LockingComponent } from './locking.component';

describe('LockingComponent', () => {
  let component: LockingComponent;
  let fixture: ComponentFixture<LockingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LockingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LockingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
