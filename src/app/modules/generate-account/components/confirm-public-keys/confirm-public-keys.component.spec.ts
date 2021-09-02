import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmPublicKeysComponent } from './confirm-public-keys.component';

describe('ConfirmPublicKeysComponent', () => {
  let component: ConfirmPublicKeysComponent;
  let fixture: ComponentFixture<ConfirmPublicKeysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmPublicKeysComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPublicKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
