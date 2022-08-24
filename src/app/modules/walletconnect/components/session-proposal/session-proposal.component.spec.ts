import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionProposalComponent } from './session-proposal.component';

describe('SessionProposalComponent', () => {
  let component: SessionProposalComponent;
  let fixture: ComponentFixture<SessionProposalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionProposalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionProposalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
