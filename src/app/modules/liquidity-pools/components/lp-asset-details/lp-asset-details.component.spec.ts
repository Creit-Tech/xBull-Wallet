import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LpAssetDetailsComponent } from './lp-asset-details.component';

describe('LpAssetDetailsComponent', () => {
  let component: LpAssetDetailsComponent;
  let fixture: ComponentFixture<LpAssetDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LpAssetDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LpAssetDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
