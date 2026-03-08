import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeeklyMeetingsPage } from './weekly.meetings.page';

describe('WeeklyMeetingsPage', () => {
  let component: WeeklyMeetingsPage;
  let fixture: ComponentFixture<WeeklyMeetingsPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(WeeklyMeetingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
