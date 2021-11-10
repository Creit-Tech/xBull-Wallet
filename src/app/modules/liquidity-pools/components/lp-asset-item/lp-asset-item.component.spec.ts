import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LpAssetItemComponent } from './lp-asset-item.component';

describe('LpAssetItemComponent', () => {
  let component: LpAssetItemComponent;
  let fixture: ComponentFixture<LpAssetItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LpAssetItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LpAssetItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
