import { TestBed } from '@angular/core/testing';

import { NetworkValidateService } from './network-validate.service';

describe('NetworkValidateService', () => {
  let service: NetworkValidateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkValidateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
