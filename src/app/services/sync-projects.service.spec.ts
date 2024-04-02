import { TestBed } from '@angular/core/testing';

import { SyncProjectsService } from './sync-projects.service';

describe('SyncProjectsService', () => {
  let service: SyncProjectsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncProjectsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
