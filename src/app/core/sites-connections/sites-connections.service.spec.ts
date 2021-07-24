import { TestBed } from '@angular/core/testing';

import { SitesConnectionsService } from './sites-connections.service';

describe('SitesConnectionsService', () => {
  let service: SitesConnectionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SitesConnectionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
