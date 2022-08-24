import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionRequestComponent } from './session-request.component';

describe('SessionRequestComponent', () => {
  let component: SessionRequestComponent;
  let fixture: ComponentFixture<SessionRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionRequestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
