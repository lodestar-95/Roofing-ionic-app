import { TestBed } from '@angular/core/testing';

import { RolesPermissionsService } from './roles-permissions.service';

describe('RolesPermissionsService', () => {
  let service: RolesPermissionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RolesPermissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
