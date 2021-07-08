import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportXdrComponent } from './import-xdr.component';

describe('ImportXdrComponent', () => {
  let component: ImportXdrComponent;
  let fixture: ComponentFixture<ImportXdrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportXdrComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportXdrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
