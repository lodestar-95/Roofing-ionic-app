import { TestBed } from '@angular/core/testing';

import { BugsReportsService } from './bugs-reports.service';

describe('BugsReportsService', () => {
  let service: BugsReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BugsReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
