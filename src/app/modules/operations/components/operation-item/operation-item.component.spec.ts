import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationItemComponent } from './operation-item.component';

describe('OperationItemComponent', () => {
  let component: OperationItemComponent;
  let fixture: ComponentFixture<OperationItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OperationItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
