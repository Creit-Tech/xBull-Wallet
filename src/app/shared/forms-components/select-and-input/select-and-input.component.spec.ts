import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectAndInputComponent } from './select-and-input.component';

describe('SelectAndInputComponent', () => {
  let component: SelectAndInputComponent;
  let fixture: ComponentFixture<SelectAndInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectAndInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectAndInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
