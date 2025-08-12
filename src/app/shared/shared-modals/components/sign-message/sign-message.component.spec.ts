import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignMessageComponent } from './sign-message.component';

describe('SignMessageComponent', () => {
  let component: SignMessageComponent;
  let fixture: ComponentFixture<SignMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
