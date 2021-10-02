import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AntiSpamOptionsComponent } from './anti-spam-options.component';

describe('AntiSpamOptionsComponent', () => {
  let component: AntiSpamOptionsComponent;
  let fixture: ComponentFixture<AntiSpamOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AntiSpamOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AntiSpamOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
