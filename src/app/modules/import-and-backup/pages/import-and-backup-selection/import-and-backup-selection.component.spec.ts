import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportAndBackupSelectionComponent } from './import-and-backup-selection.component';

describe('ImportAndBackupSelectionComponent', () => {
  let component: ImportAndBackupSelectionComponent;
  let fixture: ComponentFixture<ImportAndBackupSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportAndBackupSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportAndBackupSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
