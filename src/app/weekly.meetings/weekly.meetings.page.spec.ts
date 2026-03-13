import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WeeklyMeetingsPage } from './weekly.meetings.page';

describe('WeeklyMeetingsPage', () => {
  let component: WeeklyMeetingsPage;
  let fixture: ComponentFixture<WeeklyMeetingsPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(WeeklyMeetingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
