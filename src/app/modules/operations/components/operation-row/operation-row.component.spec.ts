import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationRowComponent } from './operation-row.component';

describe('OperationRowComponent', () => {
  let component: OperationRowComponent;
  let fixture: ComponentFixture<OperationRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationRowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OperationRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
