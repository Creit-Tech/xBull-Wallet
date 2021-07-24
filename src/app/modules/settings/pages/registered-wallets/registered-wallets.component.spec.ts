import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisteredWalletsComponent } from './registered-wallets.component';

describe('RegisteredWalletsComponent', () => {
  let component: RegisteredWalletsComponent;
  let fixture: ComponentFixture<RegisteredWalletsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisteredWalletsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisteredWalletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
