import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectAccountComponent } from './connect-account.component';

describe('ConnectAccountComponent', () => {
  let component: ConnectAccountComponent;
  let fixture: ComponentFixture<ConnectAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectAccountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
