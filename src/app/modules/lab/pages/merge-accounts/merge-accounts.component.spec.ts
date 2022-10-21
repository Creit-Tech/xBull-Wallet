import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeAccountsComponent } from './merge-accounts.component';

describe('MergeAccountsComponent', () => {
  let component: MergeAccountsComponent;
  let fixture: ComponentFixture<MergeAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MergeAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MergeAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
