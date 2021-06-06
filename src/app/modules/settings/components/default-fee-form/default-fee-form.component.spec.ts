import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultFeeFormComponent } from './default-fee-form.component';

describe('DefaultFeeFormComponent', () => {
  let component: DefaultFeeFormComponent;
  let fixture: ComponentFixture<DefaultFeeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DefaultFeeFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultFeeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
