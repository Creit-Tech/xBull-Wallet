import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnchoredAssetInteractionDrawerComponent } from './anchored-asset-interaction-drawer.component';

describe('AnchoredAssetInteractionDrawerComponent', () => {
  let component: AnchoredAssetInteractionDrawerComponent;
  let fixture: ComponentFixture<AnchoredAssetInteractionDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnchoredAssetInteractionDrawerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnchoredAssetInteractionDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
