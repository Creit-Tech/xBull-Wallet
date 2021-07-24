import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountSelectionsComponent } from './create-account-selections.component';

describe('CreateAccountSelectionsComponent', () => {
  let component: CreateAccountSelectionsComponent;
  let fixture: ComponentFixture<CreateAccountSelectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateAccountSelectionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAccountSelectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
