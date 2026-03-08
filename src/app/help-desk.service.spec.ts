import { TestBed } from '@angular/core/testing';

import { HelpDeskService } from './help-desk.service';

describe('HelpDeskService', () => {
  let service: HelpDeskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelpDeskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
