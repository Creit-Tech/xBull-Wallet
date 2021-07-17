import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectHorizonApiComponent } from './select-horizon-api.component';

describe('SelectHorizonApiComponent', () => {
  let component: SelectHorizonApiComponent;
  let fixture: ComponentFixture<SelectHorizonApiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectHorizonApiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectHorizonApiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
