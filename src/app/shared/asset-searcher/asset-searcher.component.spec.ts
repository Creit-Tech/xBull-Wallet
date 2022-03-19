import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetSearcherComponent } from './asset-searcher.component';

describe('AssetSearcherComponent', () => {
  let component: AssetSearcherComponent;
  let fixture: ComponentFixture<AssetSearcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetSearcherComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetSearcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
