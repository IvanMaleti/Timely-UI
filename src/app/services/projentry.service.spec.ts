import { TestBed } from '@angular/core/testing';

import { ProjentryService } from './projentry.service';

describe('ProjentryService', () => {
  let service: ProjentryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjentryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
