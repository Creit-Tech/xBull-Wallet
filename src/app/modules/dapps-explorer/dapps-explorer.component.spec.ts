import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DappsExplorerComponent } from './dapps-explorer.component';

describe('DappsExplorerComponent', () => {
  let component: DappsExplorerComponent;
  let fixture: ComponentFixture<DappsExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DappsExplorerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DappsExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
