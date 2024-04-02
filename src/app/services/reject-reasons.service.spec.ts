import { TestBed } from '@angular/core/testing';

import { RejectReasonsService } from './reject-reasons.service';

describe('RejectReasonsService', () => {
  let service: RejectReasonsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RejectReasonsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
