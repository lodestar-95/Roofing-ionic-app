import { TestBed } from '@angular/core/testing';

import { UserSalemanService } from './user-saleman.service';

describe('UserSalemanService', () => {
  let service: UserSalemanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserSalemanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
