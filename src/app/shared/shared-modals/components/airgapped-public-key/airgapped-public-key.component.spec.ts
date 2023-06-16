import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirgappedPublicKeyComponent } from './airgapped-public-key.component';

describe('AirgappedPublicKeyComponent', () => {
  let component: AirgappedPublicKeyComponent;
  let fixture: ComponentFixture<AirgappedPublicKeyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AirgappedPublicKeyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AirgappedPublicKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
