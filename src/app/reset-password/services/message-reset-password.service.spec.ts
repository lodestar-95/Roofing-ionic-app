import { TestBed } from '@angular/core/testing';

import { MessageResetPasswordService } from './message-reset-password.service';

describe('MessageResetPasswordService', () => {
  let service: MessageResetPasswordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageResetPasswordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
