import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletAssetItemComponent } from './wallet-asset-item.component';

describe('WalletAssetItemComponent', () => {
  let component: WalletAssetItemComponent;
  let fixture: ComponentFixture<WalletAssetItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletAssetItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletAssetItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
