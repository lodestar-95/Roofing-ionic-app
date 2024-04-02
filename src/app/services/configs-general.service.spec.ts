import { TestBed } from '@angular/core/testing';

import { ConfigsGeneralService } from './configs-general.service';

describe('ConfigsGeneralService', () => {
  let service: ConfigsGeneralService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigsGeneralService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
