import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutV1AccountHorizonSelectorComponent } from './layout-v1-account-horizon-selector.component';

describe('LayoutV1AccountHorizonSelectorComponent', () => {
  let component: LayoutV1AccountHorizonSelectorComponent;
  let fixture: ComponentFixture<LayoutV1AccountHorizonSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayoutV1AccountHorizonSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutV1AccountHorizonSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
