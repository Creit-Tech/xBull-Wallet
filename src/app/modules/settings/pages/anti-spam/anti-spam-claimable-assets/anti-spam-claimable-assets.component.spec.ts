import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AntiSpamClaimableAssetsComponent } from './anti-spam-claimable-assets.component';

describe('AntiSpamClaimableAssetsComponent', () => {
  let component: AntiSpamClaimableAssetsComponent;
  let fixture: ComponentFixture<AntiSpamClaimableAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AntiSpamClaimableAssetsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AntiSpamClaimableAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
