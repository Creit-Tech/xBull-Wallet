import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PulseLoadingComponent } from './pulse-loading.component';

describe('PulseLoadingComponent', () => {
  let component: PulseLoadingComponent;
  let fixture: ComponentFixture<PulseLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PulseLoadingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PulseLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
