import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainLayoutV1Component } from './main-layout-v1.component';

describe('MainLayoutV1Component', () => {
  let component: MainLayoutV1Component;
  let fixture: ComponentFixture<MainLayoutV1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainLayoutV1Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainLayoutV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
