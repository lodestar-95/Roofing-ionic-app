import { TestBed } from '@angular/core/testing';

import { JwtValidateService } from './jwt-validate.service';

describe('JwtValidateService', () => {
  let service: JwtValidateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtValidateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
