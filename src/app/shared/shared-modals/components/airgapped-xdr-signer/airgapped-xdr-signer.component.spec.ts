import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirgappedXdrSignerComponent } from './airgapped-xdr-signer.component';

describe('AirgappedXdrSignerComponent', () => {
  let component: AirgappedXdrSignerComponent;
  let fixture: ComponentFixture<AirgappedXdrSignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AirgappedXdrSignerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AirgappedXdrSignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
