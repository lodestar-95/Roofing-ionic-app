import { TestBed } from '@angular/core/testing';

import { SuccessDialogService } from './success.service';

describe('SuccessDialogService', () => {
  let service: SuccessDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuccessDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
