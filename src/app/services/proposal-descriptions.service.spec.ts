import { TestBed } from '@angular/core/testing';

import { ProposalDescriptionsService } from './proposal-descriptions.service';

describe('ProposalDescriptionsService', () => {
  let service: ProposalDescriptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProposalDescriptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
