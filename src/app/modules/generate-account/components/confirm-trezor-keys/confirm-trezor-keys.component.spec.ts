import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmTrezorKeysComponent } from './confirm-trezor-keys.component';

describe('ConfirmTrezorKeysComponent', () => {
  let component: ConfirmTrezorKeysComponent;
  let fixture: ComponentFixture<ConfirmTrezorKeysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmTrezorKeysComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmTrezorKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
