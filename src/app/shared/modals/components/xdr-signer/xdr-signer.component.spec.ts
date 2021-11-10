import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XdrSignerComponent } from './xdr-signer.component';

describe('XdrSignerComponent', () => {
  let component: XdrSignerComponent;
  let fixture: ComponentFixture<XdrSignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XdrSignerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XdrSignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
