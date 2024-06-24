import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectKeystoneComponent } from './connect-keystone.component';

describe('ConnectKeystoneComponent', () => {
  let component: ConnectKeystoneComponent;
  let fixture: ComponentFixture<ConnectKeystoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConnectKeystoneComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConnectKeystoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
