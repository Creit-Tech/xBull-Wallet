import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHorizonApiComponent } from './add-horizon-api.component';

describe('AddHorizonApiComponent', () => {
  let component: AddHorizonApiComponent;
  let fixture: ComponentFixture<AddHorizonApiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddHorizonApiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddHorizonApiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
