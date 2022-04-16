import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationDetailsComponent } from './operation-details.component';

describe('OperationDetailsComponent', () => {
  let component: OperationDetailsComponent;
  let fixture: ComponentFixture<OperationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OperationDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
