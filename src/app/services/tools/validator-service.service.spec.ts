import { TestBed } from '@angular/core/testing';

import { ValidatorServiceService } from './validator-service.service';

describe('ValidatorServiceService', () => {
  let service: ValidatorServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidatorServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
