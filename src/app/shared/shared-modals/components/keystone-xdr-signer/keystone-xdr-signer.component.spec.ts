import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeystoneXdrSignerComponent } from './keystone-xdr-signer.component';

describe('KeystoneXdrSignerComponent', () => {
  let component: KeystoneXdrSignerComponent;
  let fixture: ComponentFixture<KeystoneXdrSignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KeystoneXdrSignerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KeystoneXdrSignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
