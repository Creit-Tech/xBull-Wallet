import { TestBed } from '@angular/core/testing';

import { ComponentCreatorService } from './component-creator.service';

describe('ComponentCreatorService', () => {
  let service: ComponentCreatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentCreatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
