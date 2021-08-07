import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveOperationsTypesComponent } from './active-operations-types.component';

describe('ActiveOperationsTypesComponent', () => {
  let component: ActiveOperationsTypesComponent;
  let fixture: ComponentFixture<ActiveOperationsTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActiveOperationsTypesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveOperationsTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
