import { TestBed } from '@angular/core/testing';

import { ConnectFlowService } from './connect-flow.service';

describe('ConnectFlowService', () => {
  let service: ConnectFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectFlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
