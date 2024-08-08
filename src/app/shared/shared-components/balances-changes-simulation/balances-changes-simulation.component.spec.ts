import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalancesChangesSimulationComponent } from './balances-changes-simulation.component';

describe('BalancesChangesSimulationComponent', () => {
  let component: BalancesChangesSimulationComponent;
  let fixture: ComponentFixture<BalancesChangesSimulationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BalancesChangesSimulationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BalancesChangesSimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
