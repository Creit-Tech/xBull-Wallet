import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAnchorModalComponent } from './add-anchor-modal.component';

describe('AddAnchorModalComponent', () => {
  let component: AddAnchorModalComponent;
  let fixture: ComponentFixture<AddAnchorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAnchorModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAnchorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
