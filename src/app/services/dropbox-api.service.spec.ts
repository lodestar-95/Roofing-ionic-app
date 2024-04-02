import { TestBed } from '@angular/core/testing';

import { DropboxApiService } from './dropbox-api.service';

describe('DropboxApiService', () => {
  let service: DropboxApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropboxApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
