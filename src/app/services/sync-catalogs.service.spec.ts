import { TestBed } from '@angular/core/testing';

import { SyncCatalogsService } from './sync-catalogs.service';

describe('SyncCatalogsService', () => {
  let service: SyncCatalogsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncCatalogsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
