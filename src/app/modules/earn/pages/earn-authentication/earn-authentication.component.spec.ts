import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarnAuthenticationComponent } from './earn-authentication.component';

describe('EarnAuthenticationComponent', () => {
  let component: EarnAuthenticationComponent;
  let fixture: ComponentFixture<EarnAuthenticationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EarnAuthenticationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarnAuthenticationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
