import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IosBlockPageComponent } from './ios-block-page.component';

describe('IosBlockPageComponent', () => {
  let component: IosBlockPageComponent;
  let fixture: ComponentFixture<IosBlockPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IosBlockPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IosBlockPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
