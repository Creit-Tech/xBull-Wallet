import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SepTenAuthenticationCardComponent } from './sep-ten-authentication-card.component';

describe('SepTenAuthenticationCardComponent', () => {
  let component: SepTenAuthenticationCardComponent;
  let fixture: ComponentFixture<SepTenAuthenticationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SepTenAuthenticationCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SepTenAuthenticationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
