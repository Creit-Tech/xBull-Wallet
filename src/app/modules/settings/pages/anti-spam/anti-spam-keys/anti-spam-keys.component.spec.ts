import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AntiSpamKeysComponent } from './anti-spam-keys.component';

describe('AntiSpamKeysComponent', () => {
  let component: AntiSpamKeysComponent;
  let fixture: ComponentFixture<AntiSpamKeysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AntiSpamKeysComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AntiSpamKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
