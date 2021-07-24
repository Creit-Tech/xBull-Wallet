import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletAssetsComponent } from './wallet-assets.component';

describe('WalletAssetsComponent', () => {
  let component: WalletAssetsComponent;
  let fixture: ComponentFixture<WalletAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletAssetsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
