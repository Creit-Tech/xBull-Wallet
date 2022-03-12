import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutV1HeaderComponent } from './layout-v1-header.component';

describe('LayoutV1HeaderComponent', () => {
  let component: LayoutV1HeaderComponent;
  let fixture: ComponentFixture<LayoutV1HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayoutV1HeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutV1HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
